import { useMemo, useState } from 'react';
import { Mail, Phone, MessageSquare, Calendar, Compass, AlertTriangle } from 'lucide-react';
import type { Contact } from '../lib/types';
import { topFollowupSuggestions, type FollowupSuggestion, type FollowupChannel } from '../lib/followups';

interface SuggestedFollowupsProps {
  contacts: Contact[];
  onEditContact: (c: Contact) => void;
  onDraftEmail: (c: Contact, emailType: string) => void;
}

/**
 * Dashboard card that surfaces the top contacts who need outreach right now,
 * with one-line "when via channel — approach" suggestions. Pure client-side
 * computation over the existing contacts array; no extra fetches needed.
 */
export default function SuggestedFollowups({ contacts, onEditContact, onDraftEmail }: SuggestedFollowupsProps) {
  const [now] = useState(() => new Date());
  const suggestions = useMemo(() => topFollowupSuggestions(contacts, 6, now), [contacts, now]);

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 p-5">
      {/* Corner brackets */}
      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-l border-t border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-r border-t border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-l border-b border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r border-b border-amber-500/40 rounded-[2px]" aria-hidden="true" />

      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-4 h-4 text-flame-600" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-800 flex items-center gap-1.5">
          <span className="text-slate-400">14</span>
          Suggested Follow-ups
        </h2>
        {suggestions.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">
            {suggestions.length}
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest py-4">
          Nothing urgent. Pipeline is current.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {suggestions.map((s) => (
            <SuggestionRow
              key={s.contact.id}
              suggestion={s}
              onEditContact={() => onEditContact(s.contact)}
              onDraftEmail={() => onDraftEmail(s.contact, s.emailType)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SuggestionRow({
  suggestion: s,
  onEditContact,
  onDraftEmail,
}: {
  suggestion: FollowupSuggestion;
  onEditContact: () => void;
  onDraftEmail: () => void;
}) {
  const urgencyColor =
    s.urgency === 'high'
      ? 'border-red-200 bg-red-50/40'
      : s.urgency === 'medium'
      ? 'border-amber-200 bg-amber-50/30'
      : 'border-slate-200 bg-white';

  const urgencyDot =
    s.urgency === 'high'
      ? 'bg-red-500'
      : s.urgency === 'medium'
      ? 'bg-amber-500'
      : 'bg-slate-300';

  return (
    <li
      className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors ${urgencyColor}`}
    >
      <span className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${urgencyDot}`} aria-hidden="true" />
      <button
        onClick={onEditContact}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900 truncate">
            {s.contact.business_name || s.contact.contact_name}
          </span>
          <span className="text-xs text-slate-500">{s.contact.contact_name}</span>
          {s.overdue && (
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">
              <AlertTriangle className="w-2.5 h-2.5" />
              Overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
          <span className="font-semibold">{s.when}</span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1">
            <ChannelIcon channel={s.channel} />
            <span className="capitalize">{s.channel}</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 leading-snug">{s.approach}</p>
        <p className="font-mono text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{s.reason}</p>
      </button>
      <div className="flex flex-col gap-1 flex-shrink-0">
        {s.contact.email && (
          <button
            onClick={onDraftEmail}
            title={`Draft a ${s.emailType.replace('_', ' ')} email`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-flame-600 hover:bg-flame-50 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        )}
        {s.contact.phone && s.channel === 'phone' && (
          <a
            href={`tel:${s.contact.phone}`}
            title="Call"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </li>
  );
}

function ChannelIcon({ channel }: { channel: FollowupChannel }) {
  switch (channel) {
    case 'email': return <Mail className="w-3 h-3" />;
    case 'phone': return <Phone className="w-3 h-3" />;
    case 'text': return <MessageSquare className="w-3 h-3" />;
    case 'meeting': return <Calendar className="w-3 h-3" />;
  }
}
