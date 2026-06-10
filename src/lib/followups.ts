import type { Contact, Category } from './types';

export type FollowupChannel = 'email' | 'text' | 'call';
export type FollowupUrgency = 'high' | 'medium' | 'low';
export type FollowupOccasion =
  | 'birthday'
  | 'home_anniversary'
  | 'due_followup'
  | 'lead_nudge'
  | 'active_followup'
  | 'referral_nudge'
  | 'sphere_checkin';
/** Maps to the AI draft endpoint's tone. */
export type DraftType = 'birthday' | 'anniversary' | 'check_in' | 'follow_up';

export interface FollowupSuggestion {
  contact: Contact;
  occasion: FollowupOccasion;
  when: string;        // "Today", "Tomorrow", "In 5 days", "This week"
  channel: FollowupChannel;
  reason: string;      // WHY this person is surfaced
  approach: string;    // one-line HOW
  draftType: DraftType;
  urgency: FollowupUrgency;
  daysUntil: number;   // 0 for "act today" items; days ahead for birthdays/anniversaries
}

const DAY = 86400000;

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Days since a contact was last touched (last_contacted_at, falling back to when they were added). */
function daysSinceTouch(contact: Contact, today: Date): number {
  const ref = contact.last_contacted_at ?? contact.created_at;
  const t = new Date(ref);
  if (isNaN(t.getTime())) return 0;
  return Math.floor((today.getTime() - t.getTime()) / DAY);
}

/** Days until the next annual occurrence of a YYYY-MM-DD date (0 = today). */
function daysUntilAnnual(dateStr: string, today: Date): number {
  const parts = dateStr.split('-');
  if (parts.length < 3) return 999;
  const mo = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (isNaN(mo) || isNaN(day)) return 999;
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(today.getFullYear(), mo, day);
  if (next.getTime() < t0.getTime()) next = new Date(today.getFullYear() + 1, mo, day);
  return Math.round((next.getTime() - t0.getTime()) / DAY);
}

function whenLabel(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return 'This week';
}

const URGENCY_RANK: Record<FollowupUrgency, number> = { high: 0, medium: 1, low: 2 };
const OCCASION_WINDOW = 7; // surface birthdays / anniversaries up to a week ahead

/**
 * Realtor follow-up suggester. Looks at each contact's categories, birthday,
 * closing (home) anniversary, last-contacted date, and any manual follow-up
 * date, and returns the single most relevant touch, or null if nothing is due.
 *
 * The goal is staying top of mind: warm occasion touches (birthdays, home
 * anniversaries), lead nudges until they go cold, active-client check-ins,
 * referral nudges, and quarterly sphere hellos.
 */
export function suggestFollowup(contact: Contact, today: Date = new Date()): FollowupSuggestion | null {
  const cats: Category[] = contact.categories ?? [];
  const has = (c: Category) => cats.includes(c);
  const hasPhone = !!(contact.phone && contact.phone.trim());
  const touch = daysSinceTouch(contact, today);
  const followupDue = !!(contact.next_followup && contact.next_followup <= ymd(today));

  const candidates: FollowupSuggestion[] = [];

  // Birthday (any contact with one on file)
  if (contact.birthday) {
    const d = daysUntilAnnual(contact.birthday, today);
    if (d <= OCCASION_WINDOW) {
      candidates.push({
        contact,
        occasion: 'birthday',
        when: whenLabel(d),
        channel: hasPhone ? 'text' : 'email',
        reason: d === 0 ? 'Birthday is today.' : `Birthday in ${d} day${d === 1 ? '' : 's'}.`,
        approach: 'A short, warm birthday note. Personal, no business ask.',
        draftType: 'birthday',
        urgency: d <= 1 ? 'high' : 'medium',
        daysUntil: d,
      });
    }
  }

  // Home (closing) anniversary
  if (contact.closing_anniversary) {
    const d = daysUntilAnnual(contact.closing_anniversary, today);
    if (d <= OCCASION_WINDOW) {
      candidates.push({
        contact,
        occasion: 'home_anniversary',
        when: whenLabel(d),
        channel: hasPhone ? 'text' : 'email',
        reason: d === 0 ? 'Home anniversary is today.' : `Home anniversary in ${d} day${d === 1 ? '' : 's'}.`,
        approach: 'Congratulate them on their home anniversary. A no-ask touch they will remember.',
        draftType: 'anniversary',
        urgency: d <= 1 ? 'high' : 'medium',
        daysUntil: d,
      });
    }
  }

  // Manual follow-up date has arrived
  if (followupDue) {
    candidates.push({
      contact,
      occasion: 'due_followup',
      when: 'Today',
      channel: hasPhone ? 'call' : 'email',
      reason: 'Your follow-up date has arrived.',
      approach: 'Pick up where you left off. Reference the last conversation.',
      draftType: 'follow_up',
      urgency: 'high',
      daysUntil: 0,
    });
  }

  // Lead: nudge every few days until they go cold
  if (has('Lead') && touch >= 3 && touch <= 45) {
    candidates.push({
      contact,
      occasion: 'lead_nudge',
      when: 'Today',
      channel: hasPhone ? 'call' : 'email',
      reason: `${touch} days since the last touch.`,
      approach: 'Stay on their radar. Reference their search, add one helpful step, keep it light.',
      draftType: 'follow_up',
      urgency: touch >= 5 ? 'high' : 'medium',
      daysUntil: 0,
    });
  }

  // Active buyer or seller: check in if it has gone quiet
  if ((has('Buyer') || has('Seller')) && touch >= 5) {
    candidates.push({
      contact,
      occasion: 'active_followup',
      when: 'Today',
      channel: hasPhone ? 'text' : 'email',
      reason: `Active ${has('Seller') ? 'seller' : 'buyer'}, ${touch} days quiet.`,
      approach: 'A quick check-in. Share an update or just let them know you are on it.',
      draftType: 'check_in',
      urgency: 'medium',
      daysUntil: 0,
    });
  }

  // Referral: nudge weekly until there is a decision
  if (has('Referral') && touch >= 7) {
    candidates.push({
      contact,
      occasion: 'referral_nudge',
      when: 'Today',
      channel: hasPhone ? 'call' : 'email',
      reason: `Referral, ${touch} days since the last touch.`,
      approach: 'Nudge gently. Offer to answer questions or set a time to talk.',
      draftType: 'follow_up',
      urgency: 'medium',
      daysUntil: 0,
    });
  }

  // Sphere / past clients: a warm hello roughly quarterly
  if ((has('Sphere') || has('Past Client')) && touch >= 90) {
    candidates.push({
      contact,
      occasion: 'sphere_checkin',
      when: 'This week',
      channel: 'email',
      reason: `${touch} days since the last touch. Time for a hello.`,
      approach: 'A quarterly check-in. No ask. Share something useful or just say hi.',
      draftType: 'check_in',
      urgency: 'low',
      daysUntil: 0,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) =>
    URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.daysUntil - b.daysUntil,
  );
  return candidates[0];
}

/**
 * Best suggestion per contact, ranked across the whole list. Most urgent first,
 * then soonest occasion, then name for stable ordering.
 */
export function topFollowupSuggestions(contacts: Contact[], n = 6, today: Date = new Date()): FollowupSuggestion[] {
  return contacts
    .map((c) => suggestFollowup(c, today))
    .filter((s): s is FollowupSuggestion => s !== null)
    .sort((a, b) =>
      URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] ||
      a.daysUntil - b.daysUntil ||
      a.contact.contact_name.localeCompare(b.contact.contact_name),
    )
    .slice(0, n);
}
