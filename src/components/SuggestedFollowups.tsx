import { useMemo, useState } from 'react';
import { Cake, Home, Bell, Send, UserCheck, Share2, Users, Mail, MessageSquare, Phone, Compass } from 'lucide-react';
import type { Contact } from '../lib/types';
import { topFollowupSuggestions, type FollowupSuggestion, type FollowupChannel, type FollowupOccasion } from '../lib/followups';

interface SuggestedFollowupsProps {
  contacts: Contact[];
  onSelect: (c: Contact) => void;
  limit?: number;
  title?: string;
}

const OCCASION_META: Record<FollowupOccasion, { label: string; Icon: typeof Cake }> = {
  birthday:         { label: 'Birthday',        Icon: Cake },
  home_anniversary: { label: 'Home anniversary', Icon: Home },
  due_followup:     { label: 'Follow-up due',   Icon: Bell },
  lead_nudge:       { label: 'Lead',            Icon: Send },
  active_followup:  { label: 'Active client',   Icon: UserCheck },
  referral_nudge:   { label: 'Referral',        Icon: Share2 },
  sphere_checkin:   { label: 'Check-in',        Icon: Users },
};

/**
 * Dashboard card: who to reach out to right now, with the occasion and a
 * one-line why/how. Pure client-side computation over the contacts array.
 */
export default function SuggestedFollowups({ contacts, onSelect, limit = 6, title = 'Suggested follow-ups' }: SuggestedFollowupsProps) {
  const [now] = useState(() => new Date());
  const suggestions = useMemo(() => topFollowupSuggestions(contacts, limit, now), [contacts, limit, now]);

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-silver-200/70 p-5">
      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-l border-t border-flame-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-r border-t border-flame-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-l border-b border-flame-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r border-b border-flame-500/40 rounded-[2px]" aria-hidden="true" />

      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-4 h-4 text-flame-600" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-midnight-800">{title}</h2>
        {suggestions.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-widest bg-flame-50 text-flame-700 border border-flame-100 px-2 py-0.5 rounded">
            {suggestions.length}
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <p className="font-mono text-[10px] text-silver-400 uppercase tracking-widest py-4">
          All caught up. Nobody needs a touch today.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {suggestions.map((s) => (
            <SuggestionRow key={s.contact.id} suggestion={s} onSelect={() => onSelect(s.contact)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function SuggestionRow({ suggestion: s, onSelect }: { suggestion: FollowupSuggestion; onSelect: () => void }) {
  const urgencyColor =
    s.urgency === 'high' ? 'border-red-200 bg-red-50/40'
    : s.urgency === 'medium' ? 'border-flame-200 bg-flame-50/30'
    : 'border-silver-200 bg-white';
  const urgencyDot =
    s.urgency === 'high' ? 'bg-red-500' : s.urgency === 'medium' ? 'bg-flame-500' : 'bg-silver-300';
  const { label, Icon } = OCCASION_META[s.occasion];

  return (
    <li className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors ${urgencyColor}`}>
      <span className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${urgencyDot}`} aria-hidden="true" />
      <button onClick={onSelect} className="flex-1 min-w-0 text-left">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-midnight-900 truncate">{s.contact.contact_name}</span>
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-flame-700 bg-flame-50 border border-flame-100 px-1.5 py-0.5 rounded">
            <Icon className="w-2.5 h-2.5" />
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-silver-600">
          <span className="font-semibold">{s.when}</span>
          <span className="text-silver-300">·</span>
          <span className="flex items-center gap-1 capitalize">
            <ChannelIcon channel={s.channel} />
            {s.channel}
          </span>
        </div>
        <p className="text-xs text-silver-500 mt-1 leading-snug">{s.approach}</p>
        <p className="font-mono text-[10px] text-silver-400 mt-1 uppercase tracking-wider">{s.reason}</p>
      </button>
    </li>
  );
}

function ChannelIcon({ channel }: { channel: FollowupChannel }) {
  switch (channel) {
    case 'email': return <Mail className="w-3 h-3" />;
    case 'text': return <MessageSquare className="w-3 h-3" />;
    case 'call': return <Phone className="w-3 h-3" />;
  }
}
