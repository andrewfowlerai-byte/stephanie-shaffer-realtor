import { supabase } from './supabase';
import { localDateString } from './dateLabels';
import type { Contact } from './types';
import type { DraftType } from './followups';

export type CampaignType = 'sequence' | 'broadcast';
export type CampaignChannel = 'email' | 'text' | 'call';
export type StepDraftType = DraftType | 'intro';
export type EnrollmentStatus = 'active' | 'completed' | 'paused' | 'stopped';

export interface CampaignStep {
  id?: string;
  campaign_id?: string;
  position: number;
  day_offset: number;
  channel: CampaignChannel;
  draft_type: StepDraftType;
  subject: string | null;
  body: string | null;   // fixed template (supports {{first_name}}); null = AI-draft
  prompt: string | null;  // context handed to the AI draft
}

export interface Campaign {
  id: string;
  created_at?: string;
  name: string;
  description: string | null;
  type: CampaignType;
  active: boolean;
  steps: CampaignStep[];
  enrolledCount?: number;
}

export interface CampaignEnrollment {
  id: string;
  campaign_id: string;
  contact_id: string;
  enrolled_at: string;
  current_step: number;
  next_due: string | null;
  status: EnrollmentStatus;
}

export interface DueTouch {
  enrollment: CampaignEnrollment;
  campaign: Campaign;
  step: CampaignStep;
  contact: Contact;
  message: string | null; // resolved fixed template, or null when the step is AI-drafted
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function addDays(fromIso: string, days: number): string {
  const d = new Date(fromIso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Merge {{first_name}} / {{name}} into a fixed template; null body stays null (AI-drafted). */
export function resolveTemplate(body: string | null, contact: Contact): string | null {
  if (!body) return null;
  const first = contact.contact_name.trim().split(/\s+/)[0] || contact.contact_name;
  return body.replace(/\{\{\s*first_name\s*\}\}/gi, first).replace(/\{\{\s*name\s*\}\}/gi, contact.contact_name);
}

function sortedSteps(steps: CampaignStep[] | undefined): CampaignStep[] {
  return [...(steps ?? [])].sort((a, b) => a.position - b.position);
}

// ─── Campaign CRUD ──────────────────────────────────────────────────────-

export async function listCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, campaign_steps(*), campaign_enrollments(count)')
    .order('created_at', { ascending: false });
  if (error) { console.error('[campaigns] list failed', error); return []; }
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    created_at: c.created_at as string,
    name: c.name as string,
    description: (c.description as string) ?? null,
    type: c.type as CampaignType,
    active: c.active as boolean,
    steps: sortedSteps(c.campaign_steps as CampaignStep[]),
    enrolledCount: (c.campaign_enrollments as { count: number }[] | undefined)?.[0]?.count ?? 0,
  }));
}

export async function createCampaign(
  campaign: { name: string; description?: string | null; type: CampaignType; active?: boolean },
  steps: Omit<CampaignStep, 'id' | 'campaign_id'>[],
): Promise<string> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name: campaign.name, description: campaign.description ?? null, type: campaign.type, active: campaign.active ?? true })
    .select('id')
    .single();
  if (error) throw error;
  const id = (data as { id: string }).id;
  if (steps.length > 0) await replaceSteps(id, steps);
  return id;
}

export async function updateCampaign(
  id: string,
  patch: { name?: string; description?: string | null; type?: CampaignType; active?: boolean },
  steps?: Omit<CampaignStep, 'id' | 'campaign_id'>[],
): Promise<void> {
  const { error } = await supabase.from('campaigns').update(patch).eq('id', id);
  if (error) throw error;
  if (steps) await replaceSteps(id, steps);
}

async function replaceSteps(campaignId: string, steps: Omit<CampaignStep, 'id' | 'campaign_id'>[]): Promise<void> {
  await supabase.from('campaign_steps').delete().eq('campaign_id', campaignId);
  const rows = steps.map((s, i) => ({
    campaign_id: campaignId,
    position: i,
    day_offset: s.day_offset,
    channel: s.channel,
    draft_type: s.draft_type,
    subject: s.subject ?? null,
    body: s.body ?? null,
    prompt: s.prompt ?? null,
  }));
  if (rows.length > 0) {
    const { error } = await supabase.from('campaign_steps').insert(rows);
    if (error) throw error;
  }
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

// ─── Enrollment ───────────────────────────────────────────────────────────

/** Enroll contacts into a campaign. Duplicates (same campaign + contact) are skipped. */
export async function enrollContacts(campaign: Campaign, contactIds: string[]): Promise<number> {
  if (contactIds.length === 0) return 0;
  const steps = sortedSteps(campaign.steps);
  const first = steps[0];
  const nextDue = first ? addDays(new Date().toISOString(), first.day_offset) : localDateString();
  const rows = contactIds.map((cid) => ({
    campaign_id: campaign.id,
    contact_id: cid,
    current_step: 0,
    next_due: nextDue,
    status: 'active' as const,
  }));
  const { data, error } = await supabase
    .from('campaign_enrollments')
    .upsert(rows, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/** Enroll every contact that has the given category into the campaign. */
export async function enrollByCategory(campaign: Campaign, category: string): Promise<number> {
  const { data, error } = await supabase.from('contacts').select('id').contains('categories', [category]);
  if (error) throw error;
  const ids = (data ?? []).map((r: { id: string }) => r.id);
  return enrollContacts(campaign, ids);
}

export async function stopEnrollment(id: string): Promise<void> {
  const { error } = await supabase.from('campaign_enrollments').update({ status: 'stopped', next_due: null }).eq('id', id);
  if (error) throw error;
}

/** Advance an enrollment to its next step (or complete it). Call after a touch is sent. */
export async function advanceEnrollment(enrollment: CampaignEnrollment, steps: CampaignStep[]): Promise<void> {
  const ordered = sortedSteps(steps);
  const next = enrollment.current_step + 1;
  if (next < ordered.length) {
    const nextDue = addDays(enrollment.enrolled_at, ordered[next].day_offset);
    const { error } = await supabase.from('campaign_enrollments').update({ current_step: next, next_due: nextDue }).eq('id', enrollment.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('campaign_enrollments').update({ status: 'completed', next_due: null }).eq('id', enrollment.id);
    if (error) throw error;
  }
}

// ─── Due touches (what to send today) ──────────────────────────────────────

export async function fetchDueCampaignTouches(): Promise<DueTouch[]> {
  const todayStr = localDateString();
  const { data, error } = await supabase
    .from('campaign_enrollments')
    .select('*, campaign:campaigns(*, campaign_steps(*)), contact:contacts(*)')
    .eq('status', 'active')
    .lte('next_due', todayStr)
    .order('next_due', { ascending: true });
  if (error) { console.error('[campaigns] due touches failed', error); return []; }

  const touches: DueTouch[] = [];
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const campaignRaw = row.campaign as (Record<string, unknown> | null);
    const contact = row.contact as (Contact | null);
    if (!campaignRaw || !campaignRaw.active || !contact) continue;
    const steps = sortedSteps(campaignRaw.campaign_steps as CampaignStep[]);
    const step = steps[row.current_step as number];
    if (!step) continue;
    const campaign: Campaign = {
      id: campaignRaw.id as string,
      name: campaignRaw.name as string,
      description: (campaignRaw.description as string) ?? null,
      type: campaignRaw.type as CampaignType,
      active: campaignRaw.active as boolean,
      steps,
    };
    const enrollment: CampaignEnrollment = {
      id: row.id as string,
      campaign_id: row.campaign_id as string,
      contact_id: row.contact_id as string,
      enrolled_at: row.enrolled_at as string,
      current_step: row.current_step as number,
      next_due: (row.next_due as string) ?? null,
      status: row.status as EnrollmentStatus,
    };
    touches.push({ enrollment, campaign, step, contact, message: resolveTemplate(step.body, contact) });
  }
  return touches;
}

// ─── Preset templates ──────────────────────────────────────────────────────

export interface CampaignTemplate {
  name: string;
  description: string;
  type: CampaignType;
  steps: Omit<CampaignStep, 'id' | 'campaign_id'>[];
}

const step = (day_offset: number, channel: CampaignChannel, draft_type: StepDraftType, prompt: string): Omit<CampaignStep, 'id' | 'campaign_id'> =>
  ({ position: 0, day_offset, channel, draft_type, subject: null, body: null, prompt });

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    name: 'New Lead Nurture',
    description: 'Stay in front of a new lead until they are ready.',
    type: 'sequence',
    steps: [
      step(0, 'text', 'intro', 'Warm intro. Thank them for reaching out and ask how you can help.'),
      step(2, 'email', 'follow_up', 'Follow up. Offer to set up a home search or answer any questions.'),
      step(6, 'text', 'follow_up', 'Light check-in. Share one helpful tip and keep it casual.'),
      step(14, 'email', 'check_in', 'No-pressure check-in. Let them know you are here whenever they are ready.'),
      step(30, 'text', 'check_in', 'Monthly hello. Ask if anything has changed in their search.'),
    ],
  },
  {
    name: 'Past Client Annual',
    description: 'Yearly touchpoints to stay top of mind with past clients.',
    type: 'sequence',
    steps: [
      step(0, 'text', 'check_in', 'Warm hello. Hope they are loving the home.'),
      step(90, 'email', 'check_in', 'Quarterly check-in. Share a brief local market note.'),
      step(180, 'text', 'check_in', 'Mid-year hello. Offer to help if they know anyone thinking of moving.'),
      step(270, 'email', 'check_in', 'Check-in plus a useful homeowner tip.'),
    ],
  },
  {
    name: 'Sphere Quarterly',
    description: 'A warm hello to your sphere every quarter.',
    type: 'sequence',
    steps: [
      step(0, 'email', 'check_in', 'Friendly hello with no ask.'),
      step(90, 'email', 'check_in', 'Quarterly hello. Share something useful.'),
      step(180, 'email', 'check_in', 'Quarterly hello.'),
      step(270, 'email', 'check_in', 'Quarterly hello.'),
    ],
  },
  {
    name: 'Open House Follow-up',
    description: 'Follow up with people who visited an open house.',
    type: 'sequence',
    steps: [
      step(0, 'text', 'follow_up', 'Thank them for visiting the open house and ask what they thought.'),
      step(2, 'email', 'follow_up', 'Share the listing details and offer to answer questions or show similar homes.'),
      step(7, 'text', 'check_in', 'Check in to see if they want to keep looking.'),
    ],
  },
  {
    name: 'Market Update (broadcast)',
    description: 'A one-time market update to a segment.',
    type: 'broadcast',
    steps: [
      step(0, 'email', 'check_in', 'Share a brief, warm market update for Northeast Ohio. No hard sell, just helpful.'),
    ],
  },
];
