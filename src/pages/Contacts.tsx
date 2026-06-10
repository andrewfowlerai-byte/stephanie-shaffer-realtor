import { useMemo, useState } from 'react';
import { Search, Pencil, Trash2, Sparkles, Upload, Clock, Check } from 'lucide-react';
import type { Contact, Category } from '../lib/types';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import ContactModal from '../components/ContactModal';
import ImportContacts from '../components/ImportContacts';
import DraftModal from '../components/DraftModal';
import { useStringParam, useEnumParam } from '../hooks/useSearchParamState';

interface ContactsProps {
  contacts: Contact[];
  loading: boolean;
  addContact: (data: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

function daysAgoLabel(iso?: string): string | null {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (isNaN(d)) return null;
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d}d ago`;
}

export default function Contacts({ contacts, loading, addContact, updateContact, deleteContact, refresh }: ContactsProps) {
  const [search, setSearch] = useStringParam('q', '');
  const [categoryFilter, setCategoryFilter] = useEnumParam<Category | ''>('cat', ['', ...CATEGORIES] as const, '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState<Category | ''>('');
  const [busy, setBusy] = useState(false);

  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [draftFor, setDraftFor] = useState<Contact | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [recentlyLogged, setRecentlyLogged] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...contacts];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.contact_name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter((c) => (c.categories ?? []).includes(categoryFilter));
    }
    return result;
  }, [contacts, search, categoryFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((c) => c.id)));
  };

  async function applyBulk(add: boolean) {
    if (!bulkCat || selected.size === 0) return;
    setBusy(true);
    try {
      const updates = [...selected].flatMap((id) => {
        const c = contacts.find((x) => x.id === id);
        if (!c) return [];
        const cur = c.categories ?? [];
        if (add && cur.includes(bulkCat)) return [];
        if (!add && !cur.includes(bulkCat)) return [];
        const next = add ? Array.from(new Set([...cur, bulkCat])) : cur.filter((x) => x !== bulkCat);
        return [supabase.from('contacts').update({ categories: next }).eq('id', id)];
      });
      await Promise.all(updates);
      await refresh();
      setSelected(new Set());
      setBulkCat('');
    } finally {
      setBusy(false);
    }
  }

  async function markContacted(c: Contact) {
    try {
      await updateContact(c.id, { last_contacted_at: new Date().toISOString() });
      setRecentlyLogged(c.id);
      setTimeout(() => setRecentlyLogged(null), 2000);
    } catch (err) {
      console.error('mark contacted failed', err);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteContact(confirmDelete.id);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
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
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">Contacts</h1>
          <p className="text-silver-500 text-sm mt-0.5">{contacts.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 border border-silver-300 text-midnight-700 hover:bg-silver-100 font-medium rounded-lg px-3.5 py-2 text-sm transition-colors"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-flame-600 hover:bg-flame-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="w-full pl-9 pr-4 py-2 border border-silver-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | '')}
          className="px-3 py-2 border border-silver-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
      </div>

      {/* Bulk tag bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-flame-50 border border-flame-200 rounded-xl px-4 py-2.5">
          <span className="text-sm font-semibold text-flame-800">{selected.size} selected</span>
          <select
            value={bulkCat}
            onChange={(e) => setBulkCat(e.target.value as Category | '')}
            className="px-3 py-1.5 border border-silver-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-flame-500"
          >
            <option value="">Choose category…</option>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <button onClick={() => applyBulk(true)} disabled={!bulkCat || busy} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-flame-600 hover:bg-flame-700 disabled:opacity-50 text-white transition-colors">
            Add tag
          </button>
          <button onClick={() => applyBulk(false)} disabled={!bulkCat || busy} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-silver-300 hover:bg-silver-100 disabled:opacity-50 text-midnight-700 transition-colors">
            Remove tag
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-silver-500 hover:text-midnight-800 ml-auto">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-silver-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver-200 bg-silver-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-silver-300 text-flame-600 focus:ring-flame-500" aria-label="Select all" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-silver-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-silver-600 hidden md:table-cell">Categories</th>
                <th className="text-left px-4 py-3 font-semibold text-silver-600 hidden lg:table-cell">Last touch</th>
                <th className="text-right px-4 py-3 font-semibold text-silver-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-silver-400">
                    {contacts.length === 0 ? 'No contacts yet. Import a phone export or add one.' : 'No contacts match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((contact) => {
                  const cats = contact.categories ?? [];
                  const lastTouch = daysAgoLabel(contact.last_contacted_at);
                  return (
                    <tr
                      key={contact.id}
                      className="border-b border-silver-100 hover:bg-silver-50 transition-colors cursor-pointer"
                      onClick={() => setEditContact(contact)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(contact.id)} onChange={() => toggleSelect(contact.id)} className="w-4 h-4 rounded border-silver-300 text-flame-600 focus:ring-flame-500" aria-label={`Select ${contact.contact_name}`} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-midnight-900">{contact.contact_name}</p>
                        <p className="text-xs text-silver-400">{contact.email || contact.phone || ''}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {cats.length === 0 ? (
                            <span className="text-silver-300">-</span>
                          ) : cats.map((c) => (
                            <span key={c} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[c]}`}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {lastTouch ? <span className="text-xs text-silver-500">{lastTouch}</span> : <span className="text-silver-300">-</span>}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => markContacted(contact)} title="Log a touch (mark contacted today)" className="p-1.5 rounded-lg hover:bg-green-50 hover:text-green-600 text-silver-400 transition-colors">
                            {recentlyLogged === contact.id ? <Check className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setDraftFor(contact)} title="Draft a message" className="p-1.5 rounded-lg hover:bg-flame-50 hover:text-flame-600 text-silver-400 transition-colors">
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditContact(contact)} title="Edit" className="p-1.5 rounded-lg hover:bg-flame-50 hover:text-flame-600 text-silver-400 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setConfirmDelete(contact)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-silver-400 transition-colors">
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

      {draftFor && <DraftModal contact={draftFor} onClose={() => setDraftFor(null)} />}

      {editContact && (
        <ContactModal contact={editContact} onSave={addContact} onUpdate={updateContact} onClose={() => setEditContact(null)} />
      )}
      {showAdd && <ContactModal onSave={addContact} onClose={() => setShowAdd(false)} />}
      {showImport && <ImportContacts existing={contacts} onClose={() => setShowImport(false)} onImported={refresh} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-silver-200 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-midnight-900 mb-2">Delete contact</h3>
            <p className="text-silver-500 text-sm mb-6">Delete <strong>{confirmDelete.contact_name}</strong>? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-silver-600 hover:bg-silver-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
