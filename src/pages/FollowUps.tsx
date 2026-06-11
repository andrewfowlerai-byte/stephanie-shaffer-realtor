import { useEffect, useMemo, useState } from 'react';
import { Cake, Home, Bell, Send, UserCheck, Share2, Users, Mail, MessageSquare, Phone, Sparkles, Clock, Megaphone } from 'lucide-react';
import type { Contact } from '../lib/types';
import { topFollowupSuggestions, type FollowupOccasion, type FollowupSuggestion } from '../lib/followups';
import type { DraftChannel } from '../lib/draft';
import { fetchDueCampaignTouches, advanceEnrollment, type DueTouch } from '../lib/campaigns';
import DraftModal from '../components/DraftModal';

interface FollowUpsProps {
  contacts: Contact[];
  loading: boolean;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
}

interface DraftTarget {
  contact: Contact;
  channel: DraftChannel;
  draftType: FollowupSuggestion['draftType'] | 'intro';
  context?: string;
}

const OCCASION_META: Record<FollowupOccasion, { label: string; Icon: typeof Cake }> = {
  birthday:         { label: 'Birthday',         Icon: Cake },
  home_anniversary: { label: 'Home anniversary', Icon: Home },
  due_followup:     { label: 'Follow-up due',    Icon: Bell },
  lead_nudge:       { label: 'Lead',             Icon: Send },
  active_followup:  { label: 'Active client',    Icon: UserCheck },
  referral_nudge:   { label: 'Referral',         Icon: Share2 },
  sphere_checkin:   { label: 'Check-in',         Icon: Users },
};

export default function FollowUps({ contacts, loading, updateContact }: FollowUpsProps) {
  const [now] = useState(() => new Date());
  const [draftTarget, setDraftTarget] = useState<DraftTarget | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [touches, setTouches] = useState<DueTouch[]>([]);

  const suggestions = useMemo(() => topFollowupSuggestions(contacts, 50, now), [contacts, now]);

  useEffect(() => {
    let cancelled = false;
    fetchDueCampaignTouches().then((t) => { if (!cancelled) setTouches(t); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function markContacted(c: Contact) {
    setPending(c.id);
    try { await updateContact(c.id, { last_contacted_at: new Date().toISOString() }); }
    catch (err) { console.error('mark contacted failed', err); }
    finally { setPending(null); }
  }

  async function markTouchSent(t: DueTouch) {
    setPending(t.enrollment.id);
    try {
      await advanceEnrollment(t.enrollment, t.campaign.steps);
      await updateContact(t.contact.id, { last_contacted_at: new Date().toISOString() });
      setTouches((prev) => prev.filter((x) => x.enrollment.id !== t.enrollment.id));
    } catch (err) {
      console.error('mark touch sent failed', err);
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-flame-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-midnight-900">Who to reach out to today</h1>
        <p className="text-sm text-silver-600 mt-0.5">Campaign touches and timely follow-ups, with a draft ready for each.</p>
      </div>

      {/* Campaign touches */}
      {touches.length > 0 && (
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-midnight-800 mb-3 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-flame-600" /> Campaign touches
            <span className="font-sans text-[10px] bg-flame-50 text-flame-700 border border-flame-100 px-2 py-0.5 rounded">{touches.length}</span>
          </h2>
          <ul className="space-y-3">
            {touches.map((t) => {
              const channel: DraftChannel = t.step.channel === 'email' ? 'email' : 'text';
              return (
                <li key={t.enrollment.id} className="bg-white rounded-2xl border border-silver-200 shadow-sm p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-midnight-900">{t.contact.contact_name}</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-flame-700 bg-flame-50 border border-flame-100 px-1.5 py-0.5 rounded">
                      <Megaphone className="w-2.5 h-2.5" /> {t.campaign.name}
                    </span>
                    <span className="text-xs text-silver-500 capitalize">{t.step.channel}</span>
                  </div>
                  {t.step.prompt && <p className="text-sm text-silver-600 mt-1 leading-snug">{t.step.prompt}</p>}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <button onClick={() => setDraftTarget({ contact: t.contact, channel, draftType: t.step.draft_type, context: t.step.prompt ?? t.campaign.name })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-flame-600 hover:bg-flame-700 text-white transition-colors">
                      <Sparkles className="w-3.5 h-3.5" /> Draft {channel === 'text' ? 'text' : 'email'}
                    </button>
                    {t.contact.email && <a href={`mailto:${t.contact.email}`} className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs text-midnight-700 hover:bg-silver-100 border border-silver-200" title="Email"><Mail className="w-3.5 h-3.5" /></a>}
                    {t.contact.phone && <a href={`sms:${t.contact.phone}`} className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs text-midnight-700 hover:bg-silver-100 border border-silver-200" title="Text"><MessageSquare className="w-3.5 h-3.5" /></a>}
                    <button onClick={() => markTouchSent(t)} disabled={pending === t.enrollment.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-700 hover:bg-green-50 border border-green-200 disabled:opacity-50 transition-colors ml-auto" title="Mark sent and advance the campaign">
                      {pending === t.enrollment.id ? <span className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <Clock className="w-3.5 h-3.5" />} Sent
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Cadence suggestions */}
      <div>
        {touches.length > 0 && (
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-midnight-800 mb-3">Timely follow-ups</h2>
        )}
        {suggestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-silver-200 p-10 text-center">
            <Sparkles className="w-8 h-8 text-flame-500 mx-auto" />
            <p className="mt-3 font-display text-lg text-midnight-900">Nothing pressing.</p>
            <p className="text-sm text-silver-500 mt-1">Import contacts, tag them, and enroll them in a campaign to fill this list.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {suggestions.map((s) => {
              const { label, Icon } = OCCASION_META[s.occasion];
              const c = s.contact;
              const urgencyDot = s.urgency === 'high' ? 'bg-red-500' : s.urgency === 'medium' ? 'bg-flame-500' : 'bg-silver-300';
              const draftChannel: DraftChannel = s.channel === 'email' ? 'email' : 'text';
              return (
                <li key={c.id} className="bg-white rounded-2xl border border-silver-200 shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${urgencyDot}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-midnight-900">{c.contact_name}</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-flame-700 bg-flame-50 border border-flame-100 px-1.5 py-0.5 rounded">
                          <Icon className="w-2.5 h-2.5" /> {label}
                        </span>
                        <span className="text-xs font-semibold text-silver-500">{s.when}</span>
                      </div>
                      <p className="text-sm text-silver-600 mt-1 leading-snug">{s.approach}</p>
                      <p className="font-mono text-[10px] text-silver-400 mt-1 uppercase tracking-wider">{s.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pl-5 flex-wrap">
                    <button onClick={() => setDraftTarget({ contact: c, channel: draftChannel, draftType: s.draftType, context: s.reason })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-flame-600 hover:bg-flame-700 text-white transition-colors">
                      <Sparkles className="w-3.5 h-3.5" /> Draft {draftChannel === 'text' ? 'text' : 'email'}
                    </button>
                    {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs text-midnight-700 hover:bg-silver-100 border border-silver-200" title="Email"><Mail className="w-3.5 h-3.5" /></a>}
                    {c.phone && <a href={`sms:${c.phone}`} className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs text-midnight-700 hover:bg-silver-100 border border-silver-200" title="Text"><MessageSquare className="w-3.5 h-3.5" /></a>}
                    {c.phone && <a href={`tel:${c.phone}`} className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs text-midnight-700 hover:bg-silver-100 border border-silver-200" title="Call"><Phone className="w-3.5 h-3.5" /></a>}
                    <button onClick={() => markContacted(c)} disabled={pending === c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-green-700 hover:bg-green-50 border border-green-200 disabled:opacity-50 transition-colors ml-auto" title="Mark contacted">
                      {pending === c.id ? <span className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <Clock className="w-3.5 h-3.5" />} Done
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {draftTarget && (
        <DraftModal
          contact={draftTarget.contact}
          initialChannel={draftTarget.channel}
          initialDraftType={draftTarget.draftType}
          context={draftTarget.context}
          onClose={() => setDraftTarget(null)}
        />
      )}
    </div>
  );
}
