import { useState, useMemo } from 'react';
import { Search, Pencil, Trash2, ChevronUp, ChevronDown, UserCheck, Mail, Copy, Check, X, Crown } from 'lucide-react';
import type { Contact, Stage, Tier } from '../lib/types';
import { STAGES, STAGE_COLORS, TIER_DETAILS } from '../lib/constants';
import ContactModal from '../components/ContactModal';
import { useStringParam, useEnumParam } from '../hooks/useSearchParamState';

interface ContactsProps {
  contacts: Contact[];
  loading: boolean;
  addContact: (data: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

type SortField = 'business_name' | 'stage' | 'tier' | 'monthly_value' | 'next_followup';
type SortDir = 'asc' | 'desc';

// Contacts is the overarching list of EVERY contact, including clients.
// The stage badge + Crown icon on Client rows act as the visual tag.

type EmailType = 'follow_up' | 'intro' | 'proposal' | 'check_in';
const EMAIL_TYPE_OPTIONS: { value: EmailType; label: string; desc: string }[] = [
  { value: 'follow_up',  label: 'Follow-up',   desc: 'After a previous conversation' },
  { value: 'intro',      label: 'Introduction', desc: 'First outreach' },
  { value: 'proposal',   label: 'Proposal',     desc: 'Pitch or offer' },
  { value: 'check_in',   label: 'Check-in',     desc: 'Staying in touch' },
];

function EmailDraftModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [emailType, setEmailType] = useState<EmailType>('follow_up');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState('');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  async function generate() {
    setLoading(true);
    setError('');
    setDraft(null);
    try {
      const res = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contact.contact_name,
          businessName: contact.business_name,
          stage: contact.stage,
          industry: contact.industry,
          notes: contact.notes,
          emailType,
        }),
      });
      const data = await res.json() as { subject?: string; body?: string; error?: string };
      if (!res.ok || data.error) { setError(data.error ?? 'Failed to generate.'); return; }
      setDraft({ subject: data.subject ?? '', body: data.body ?? '' });
    } catch {
      setError('Could not reach the email service.');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, type: 'subject' | 'body') {
    navigator.clipboard.writeText(text).catch(() => {});
    if (type === 'subject') { setCopiedSubject(true); setTimeout(() => setCopiedSubject(false), 2000); }
    else { setCopiedBody(true); setTimeout(() => setCopiedBody(false), 2000); }
  }

  function openMailto() {
    if (!draft || !contact.email) return;
    const url = `mailto:${contact.email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    window.open(url, '_blank');
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-silver-200">
          <div>
            <h2 className="font-bold text-midnight-900 text-base">Draft Email</h2>
            <p className="text-xs text-silver-500 mt-0.5">{contact.business_name ?? contact.contact_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-silver-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-silver-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Email type */}
          <div>
            <p className="text-xs font-semibold text-silver-500 mb-2 uppercase tracking-wide">Email type</p>
            <div className="grid grid-cols-2 gap-2">
              {EMAIL_TYPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setEmailType(o.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    emailType === o.value
                      ? 'border-flame-500 bg-flame-50 text-flame-700'
                      : 'border-silver-200 text-silver-600 hover:border-silver-300'
                  }`}
                >
                  <p className="font-semibold">{o.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{o.desc}</p>
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
              <><Mail className="w-4 h-4" /> {draft ? 'Regenerate' : 'Generate Draft'}</>
            )}
          </button>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          {draft && (
            <div className="space-y-3">
              {/* Subject */}
              <div className="bg-silver-100 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-silver-500 uppercase tracking-wide">Subject</p>
                  <button
                    onClick={() => copy(draft.subject, 'subject')}
                    className="flex items-center gap-1 text-xs text-flame-600 hover:text-flame-700 font-medium"
                  >
                    {copiedSubject ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <p className="text-sm text-midnight-900 font-medium">{draft.subject}</p>
              </div>
              {/* Body */}
              <div className="bg-silver-100 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-silver-500 uppercase tracking-wide">Body</p>
                  <button
                    onClick={() => copy(draft.body, 'body')}
                    className="flex items-center gap-1 text-xs text-flame-600 hover:text-flame-700 font-medium"
                  >
                    {copiedBody ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <p className="text-sm text-midnight-800 whitespace-pre-line leading-relaxed">{draft.body}</p>
              </div>
              {contact.email && (
                <button
                  onClick={openMailto}
                  className="w-full py-2.5 border border-silver-200 text-midnight-700 hover:bg-silver-100 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Open in mail app
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Contacts({ contacts, loading, addContact, updateContact, deleteContact }: ContactsProps) {
  // Filters + sort live in the URL so a tab freeze keeps the view intact.
  const [search, setSearch] = useStringParam('q', '');
  const [stageFilter, setStageFilter] = useEnumParam<Stage | ''>(
    'stage',
    ['', ...STAGES] as const,
    '',
  );
  const [tierFilterRaw, setTierFilterRaw] = useEnumParam<'' | '1' | '2' | '3'>(
    'tier',
    ['', '1', '2', '3'] as const,
    '',
  );
  const tierFilter: Tier | '' = tierFilterRaw === '' ? '' : (Number(tierFilterRaw) as Tier);
  const setTierFilter = (t: Tier | '') => setTierFilterRaw(t === '' ? '' : (String(t) as '1' | '2' | '3'));
  const [sortField, setSortField] = useEnumParam<SortField>(
    'sort',
    ['business_name', 'stage', 'tier', 'monthly_value', 'next_followup'] as const,
    'next_followup',
  );
  const [sortDir, setSortDir] = useEnumParam<SortDir>('dir', ['asc', 'desc'] as const, 'asc');
  const sort = { field: sortField, dir: sortDir };
  const setSort = (s: { field: SortField; dir: SortDir }) => {
    setSortField(s.field);
    setSortDir(s.dir);
  };
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);
  const [draftEmailFor, setDraftEmailFor] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  const todayStr = today();

  // Show ALL contacts including clients. Clients get a Crown marker in the row.
  const clientCount = useMemo(() => contacts.filter((c) => c.stage === 'Client').length, [contacts]);
  const prospectCount = contacts.length - clientCount;

  const filtered = useMemo(() => {
    let result = [...contacts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.business_name ?? '').toLowerCase().includes(q) ||
          c.contact_name.toLowerCase().includes(q)
      );
    }

    if (stageFilter) {
      result = result.filter((c) => c.stage === stageFilter);
    }

    if (tierFilter !== '') {
      result = result.filter((c) => c.tier === tierFilter);
    }

    result.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const field = sort.field;

      if (field === 'monthly_value') {
        return ((a.monthly_value ?? 0) - (b.monthly_value ?? 0)) * dir;
      }
      if (field === 'stage') {
        const ai = STAGES.indexOf(a.stage);
        const bi = STAGES.indexOf(b.stage);
        return (ai - bi) * dir;
      }
      if (field === 'tier') {
        return ((a.tier ?? 0) - (b.tier ?? 0)) * dir;
      }
      if (field === 'next_followup') {
        const av = a.next_followup ?? '9999-99-99';
        const bv = b.next_followup ?? '9999-99-99';
        return av.localeCompare(bv) * dir;
      }
      const av = String(a[field] ?? '').toLowerCase();
      const bv = String(b[field] ?? '').toLowerCase();
      return av.localeCompare(bv) * dir;
    });

    return result;
  }, [contacts, search, stageFilter, tierFilter, sort]);

  const toggleSort = (field: SortField) => {
    setSort(
      sort.field === field
        ? { field, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
        : { field, dir: 'asc' }
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sort.dir === 'asc' ? <ChevronUp className="w-3 h-3 text-flame-600" /> : <ChevronDown className="w-3 h-3 text-flame-600" />;
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteContact(confirmDelete.id);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleConvertToClient = async (contact: Contact) => {
    setConverting(contact.id);
    try {
      await updateContact(contact.id, { stage: 'Client' });
    } finally {
      setConverting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-flame-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">Contacts</h1>
          <p className="text-silver-500 text-sm mt-0.5">
            {contacts.length} total
            {prospectCount > 0 && <span> · {prospectCount} prospect{prospectCount !== 1 ? 's' : ''}</span>}
            {clientCount > 0 && <span> · {clientCount} client{clientCount !== 1 ? 's' : ''}</span>}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-flame-600 hover:bg-flame-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
        >
          + Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-4 py-2 border border-silver-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as Stage | '')}
          className="px-3 py-2 border border-silver-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value === '' ? '' : (Number(e.target.value) as Tier))}
          className="px-3 py-2 border border-silver-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
        >
          <option value="">All Tiers</option>
          {([1, 2, 3] as const).map((t) => (
            <option key={t} value={t}>{TIER_DETAILS[t].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-silver-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver-200 bg-silver-100">
                <th className="text-left px-4 py-3 font-semibold text-silver-600">
                  <button className="flex items-center gap-1" onClick={() => toggleSort('business_name')}>
                    Name <SortIcon field="business_name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-silver-600">Contact</th>
                <th className="text-left px-4 py-3 font-semibold text-silver-600">
                  <button className="flex items-center gap-1" onClick={() => toggleSort('stage')}>
                    Stage <SortIcon field="stage" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-silver-600 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort('next_followup')}>
                    Follow-up <SortIcon field="next_followup" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-silver-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-silver-400">
                    {contacts.length === 0
                      ? 'No contacts yet. Add one to get started.'
                      : 'No contacts match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => {
                  const isOverdue = contact.next_followup && contact.next_followup < todayStr;
                  const isConverting = converting === contact.id;
                  const isClient = contact.stage === 'Client';
                  return (
                    <tr
                      key={contact.id}
                      className={`border-b border-silver-100 transition-colors cursor-pointer ${
                        isClient
                          ? 'bg-flame-50/40 hover:bg-flame-50/70 border-l-2 border-l-flame-400'
                          : 'hover:bg-silver-50'
                      }`}
                      onClick={() => setEditContact(contact)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isClient && (
                            <Crown className="w-3.5 h-3.5 text-flame-500 flex-shrink-0" fill="currentColor" />
                          )}
                          <p className="font-medium text-midnight-900">{contact.business_name || contact.contact_name}</p>
                        </div>
                        {contact.location && (
                          <p className="text-xs text-silver-400 mt-0.5">{contact.location}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-silver-600">{contact.contact_name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[contact.stage]}`}>
                          {contact.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {contact.next_followup ? (
                          <span className={`text-xs font-medium ${isOverdue ? 'text-red-500 font-semibold' : 'text-silver-500'}`}>
                            {isOverdue && '⚠ '}{contact.next_followup}
                          </span>
                        ) : (
                          <span className="text-silver-300">-</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Convert to Client (hidden for existing clients) */}
                          {!isClient && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleConvertToClient(contact); }}
                              disabled={isConverting}
                              title="Convert to Client"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 disabled:opacity-60 transition-colors"
                            >
                              {isConverting ? (
                                <span className="animate-spin w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full inline-block" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              Convert
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setDraftEmailFor(contact); }}
                            className="p-1.5 rounded-lg hover:bg-flame-50 hover:text-flame-600 text-silver-400 transition-colors"
                            title="Draft email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditContact(contact); }}
                            className="p-1.5 rounded-lg hover:bg-flame-50 hover:text-flame-600 text-silver-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(contact); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-silver-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email draft modal */}
      {draftEmailFor && (
        <EmailDraftModal contact={draftEmailFor} onClose={() => setDraftEmailFor(null)} />
      )}

      {/* Edit modal */}
      {editContact && (
        <ContactModal
          contact={editContact}
          onSave={addContact}
          onUpdate={updateContact}
          onClose={() => setEditContact(null)}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <ContactModal
          onSave={addContact}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-silver-200 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-midnight-900 mb-2">Delete Contact</h3>
            <p className="text-silver-500 text-sm mb-6">
              Are you sure you want to delete <strong>{confirmDelete.contact_name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-silver-600 hover:text-midnight-900 hover:bg-silver-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
