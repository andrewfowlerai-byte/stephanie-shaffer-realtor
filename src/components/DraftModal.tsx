import { useState } from 'react';
import { X, Copy, Check, Mail, MessageSquare, Sparkles } from 'lucide-react';
import type { Contact } from '../lib/types';
import { generateDraft, type DraftChannel } from '../lib/draft';
import type { DraftType } from '../lib/followups';

type AnyDraftType = DraftType | 'intro';

interface Props {
  contact: Contact;
  initialChannel?: DraftChannel;
  initialDraftType?: AnyDraftType;
  context?: string;
  onClose: () => void;
}

const DRAFT_TYPES: { value: AnyDraftType; label: string }[] = [
  { value: 'follow_up',   label: 'Follow-up' },
  { value: 'check_in',    label: 'Check-in' },
  { value: 'birthday',    label: 'Birthday' },
  { value: 'anniversary', label: 'Home anniversary' },
  { value: 'intro',       label: 'Intro' },
];

/** Drafts an email or text in Stephanie's voice. Copy, or open in Mail / Messages. */
export default function DraftModal({ contact, initialChannel = 'email', initialDraftType = 'check_in', context, onClose }: Props) {
  const [channel, setChannel] = useState<DraftChannel>(contact.email ? initialChannel : contact.phone ? 'text' : 'email');
  const [draftType, setDraftType] = useState<AnyDraftType>(initialDraftType);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ subject?: string; body: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'subject' | 'body' | null>(null);

  async function generate() {
    setLoading(true);
    setError('');
    setDraft(null);
    try {
      const d = await generateDraft({ channel, draftType, contactName: contact.contact_name, context, notes: contact.notes });
      setDraft(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the draft service.');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, which: 'subject' | 'body') {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  function openInApp() {
    if (!draft) return;
    if (channel === 'email' && contact.email) {
      window.open(`mailto:${contact.email}?subject=${encodeURIComponent(draft.subject ?? '')}&body=${encodeURIComponent(draft.body)}`, '_blank');
    } else if (channel === 'text' && contact.phone) {
      window.open(`sms:${contact.phone}?&body=${encodeURIComponent(draft.body)}`, '_blank');
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-flame-600 text-white' : 'bg-silver-100 text-silver-600 hover:bg-silver-200'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-silver-200">
          <div>
            <h2 className="font-bold text-midnight-900 text-base">Draft a message</h2>
            <p className="text-xs text-silver-500 mt-0.5">{contact.contact_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-silver-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-silver-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Channel */}
          <div className="flex gap-2">
            <button onClick={() => setChannel('email')} disabled={!contact.email} className={`${tabClass(channel === 'email')} disabled:opacity-40`}>
              <Mail className="w-4 h-4" /> Email
            </button>
            <button onClick={() => setChannel('text')} disabled={!contact.phone} className={`${tabClass(channel === 'text')} disabled:opacity-40`}>
              <MessageSquare className="w-4 h-4" /> Text
            </button>
          </div>

          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-silver-500 mb-2 uppercase tracking-wide">Occasion</p>
            <div className="flex flex-wrap gap-2">
              {DRAFT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setDraftType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    draftType === t.value ? 'border-flame-500 bg-flame-50 text-flame-700' : 'border-silver-200 text-silver-600 hover:border-silver-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-2.5 bg-flame-600 hover:bg-flame-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Drafting…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> {draft ? 'Regenerate' : 'Generate draft'}</>
            )}
          </button>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          {draft && (
            <div className="space-y-3">
              {channel === 'email' && draft.subject !== undefined && (
                <div className="bg-silver-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-silver-500 uppercase tracking-wide">Subject</p>
                    <button onClick={() => copy(draft.subject ?? '', 'subject')} className="flex items-center gap-1 text-xs text-flame-600 hover:text-flame-700 font-medium">
                      {copied === 'subject' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  </div>
                  <p className="text-sm text-midnight-900 font-medium">{draft.subject}</p>
                </div>
              )}
              <div className="bg-silver-100 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-silver-500 uppercase tracking-wide">{channel === 'text' ? 'Message' : 'Body'}</p>
                  <button onClick={() => copy(draft.body, 'body')} className="flex items-center gap-1 text-xs text-flame-600 hover:text-flame-700 font-medium">
                    {copied === 'body' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <p className="text-sm text-midnight-800 whitespace-pre-line leading-relaxed">{draft.body}</p>
              </div>
              {((channel === 'email' && contact.email) || (channel === 'text' && contact.phone)) && (
                <button onClick={openInApp} className="w-full py-2.5 border border-silver-200 text-midnight-700 hover:bg-silver-100 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  {channel === 'email' ? <><Mail className="w-4 h-4" /> Open in Mail</> : <><MessageSquare className="w-4 h-4" /> Open in Messages</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
