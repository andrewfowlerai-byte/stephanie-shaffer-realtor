import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Contact, Category } from '../lib/types';
import { CATEGORIES, CATEGORY_COLORS, SOURCES } from '../lib/constants';
import { useLocalDraft, clearLocalDrafts } from '../hooks/useLocalDraft';

interface ContactModalProps {
  contact?: Contact | null;
  initialCategory?: Category;
  onSave: (data: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
  onUpdate?: (id: string, data: Partial<Contact>) => Promise<void>;
  onClose: () => void;
}

type FormShape = {
  contact_name: string;
  email: string;
  phone: string;
  stage: Contact['stage'];
  categories: Category[];
  birthday: string;
  closing_anniversary: string;
  address: string;
  source: string;
  next_followup: string;
  notes: string;
};

const emptyForm = (): FormShape => ({
  contact_name: '',
  email: '',
  phone: '',
  stage: 'Prospect',
  categories: [],
  birthday: '',
  closing_anniversary: '',
  address: '',
  source: '',
  next_followup: '',
  notes: '',
});

export default function ContactModal({ contact, initialCategory, onSave, onUpdate, onClose }: ContactModalProps) {
  const draftKey = contact ? `contact-edit.${contact.id}` : 'contact-new';

  const initialForm = (): FormShape => {
    if (contact) {
      return {
        ...emptyForm(),
        contact_name: contact.contact_name ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        stage: contact.stage ?? 'Prospect',
        categories: contact.categories ?? [],
        birthday: contact.birthday ?? '',
        closing_anniversary: contact.closing_anniversary ?? '',
        address: contact.address ?? '',
        source: contact.source ?? '',
        next_followup: contact.next_followup ?? '',
        notes: contact.notes ?? '',
      };
    }
    return initialCategory ? { ...emptyForm(), categories: [initialCategory] } : emptyForm();
  };

  const [form, setForm] = useLocalDraft<FormShape>(draftKey, initialForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = <K extends keyof FormShape>(key: K, value: FormShape[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleCategory = (c: Category) => {
    const current = form.categories ?? [];
    setField('categories', current.includes(c) ? current.filter((x) => x !== c) : [...current, c]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.contact_name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: Omit<Contact, 'id' | 'created_at'> = {
        contact_name: form.contact_name.trim(),
        stage: form.stage,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        categories: form.categories,
        birthday: form.birthday || undefined,
        closing_anniversary: form.closing_anniversary || undefined,
        address: form.address.trim() || undefined,
        source: form.source || undefined,
        next_followup: form.next_followup || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (contact && onUpdate) {
        await onUpdate(contact.id, payload);
      } else {
        await onSave(payload);
      }
      clearLocalDrafts(draftKey);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save contact.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-silver-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-midnight-800 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-silver-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-silver-200">
          <h2 className="text-lg font-semibold text-midnight-900">{contact ? 'Edit contact' : 'Add contact'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-silver-100 transition-colors">
            <X className="w-5 h-5 text-silver-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.contact_name} onChange={(e) => setField('contact_name', e.target.value)} required className={inputClass} placeholder="Jane Smith" />
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className={inputClass} placeholder="jane@example.com" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={inputClass} placeholder="(555) 000-0000" />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className={labelClass}>Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = (form.categories ?? []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active ? `${CATEGORY_COLORS[c]} border-transparent ring-2 ring-flame-400/40` : 'bg-white text-silver-600 border-silver-200 hover:border-silver-300'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Birthday + Closing anniversary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Birthday</label>
              <input type="date" value={form.birthday} onChange={(e) => setField('birthday', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Home anniversary</label>
              <input type="date" value={form.closing_anniversary} onChange={(e) => setField('closing_anniversary', e.target.value)} className={inputClass} />
              <p className="text-[11px] text-silver-400 mt-1">Closing date. Powers a yearly congratulations touch.</p>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>Address</label>
            <input type="text" value={form.address} onChange={(e) => setField('address', e.target.value)} className={inputClass} placeholder="123 Main St, Town, ST" />
          </div>

          {/* Source + Next follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>How you met</label>
              <select value={form.source} onChange={(e) => setField('source', e.target.value)} className={`${inputClass} bg-white`}>
                <option value="">Select a source</option>
                {SOURCES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Next follow-up</label>
              <input type="date" value={form.next_followup} onChange={(e) => setField('next_followup', e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} className={`${inputClass} resize-none`} placeholder="How you know them, what they are looking for, anything to remember." />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-silver-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-silver-600 hover:text-midnight-900 hover:bg-silver-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            {saving ? 'Saving…' : contact ? 'Save changes' : 'Add contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
