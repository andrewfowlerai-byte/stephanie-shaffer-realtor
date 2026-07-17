import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X, Star } from 'lucide-react';
import {
  fetchTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type Testimonial,
} from '../lib/testimonials';

/** CRM manager for client testimonials (curate the imported reviews, hide any,
 *  add new ones). */
export default function ManageTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState('5');
  const [relationship, setRelationship] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => { setLoading(true); setItems(await fetchTestimonials()); setLoading(false); };
  useEffect(() => { refresh(); }, []);

  const resetForm = () => {
    setEditing(null); setName(''); setQuote(''); setRating('5'); setRelationship(''); setPublished(true); setError('');
  };
  const startEdit = (t: Testimonial) => {
    setEditing(t); setName(t.name); setQuote(t.quote); setRating(String(t.rating ?? 5));
    setRelationship(t.relationship ?? ''); setPublished(t.published); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) { setError('Name and testimonial are required.'); return; }
    setSaving(true); setError('');
    const input = {
      name: name.trim(),
      quote: quote.trim(),
      rating: Number(rating) || 5,
      relationship: relationship.trim() || null,
      date: editing?.date ?? null,
      published,
      position: editing?.position ?? 0,
    };
    try {
      if (editing) await updateTestimonial(editing.id, input);
      else await createTestimonial(input);
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (t: Testimonial) => { await updateTestimonial(t.id, { published: !t.published }); refresh(); };
  const remove = async (t: Testimonial) => { if (!confirm('Delete this testimonial?')) return; await deleteTestimonial(t.id); refresh(); };

  const inputClass = 'w-full px-3 py-2 border border-silver-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-midnight-800 mb-1';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl text-midnight-900">Testimonials</h1>
        <p className="text-sm text-silver-600 mt-0.5">Client reviews shown on your website. Only show reviews clients gave you permission to publish.</p>
      </div>

      {/* Add / edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-silver-200 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="First Last" />
          </div>
          <div>
            <label className={labelClass}>Relationship (optional)</label>
            <input type="text" value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputClass} placeholder="Buyer Client" list="ss-relationship-options" />
            <datalist id="ss-relationship-options">
              <option value="Buyer Client" />
              <option value="Seller Client" />
              <option value="Past Client" />
              <option value="Tenant Client" />
            </datalist>
            <p className="text-[11px] text-silver-500 mt-1">Tag buyers as "Buyer Client" so the website shows she helps buyers too.</p>
          </div>
        </div>
        <div>
          <label className={labelClass}>Testimonial <span className="text-red-500">*</span></label>
          <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder="Their words, as written." />
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium text-midnight-800">Rating</span>
            <select value={rating} onChange={(e) => setRating(e.target.value)} className="px-3 py-1.5 border border-silver-200 rounded-lg text-sm bg-white">
              {[5, 4, 3, 2, 1].map((n) => (<option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>))}
            </select>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 rounded border-silver-300 text-flame-600 focus:ring-flame-500" />
            <span className="text-sm font-medium text-midnight-800">Show on the website</span>
          </label>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            {saving ? 'Saving…' : editing ? 'Save changes' : <><Plus className="w-4 h-4" /> Add testimonial</>}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-1.5 text-sm text-silver-600 hover:text-midnight-900">
              <X className="w-4 h-4" /> Cancel edit
            </button>
          )}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-sm text-silver-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-silver-400">No testimonials yet. Add one above, or import from a review export.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <li key={t.id} className="bg-white rounded-xl border border-silver-200 p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-midnight-900">{t.name}</span>
                  <span className="flex items-center gap-0.5 text-flame-500">
                    {Array.from({ length: Math.max(0, Math.min(5, t.rating ?? 5)) }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                  </span>
                  {t.relationship && <span className="text-[11px] text-silver-500">{t.relationship}</span>}
                  {!t.published && <span className="text-[10px] uppercase tracking-wider bg-silver-100 text-silver-600 border border-silver-200 px-1.5 py-0.5 rounded">Hidden</span>}
                </div>
                <p className="text-xs text-silver-600 mt-1 line-clamp-2">{t.quote}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => togglePublished(t)} title={t.published ? 'Hide from website' : 'Show on website'} className="p-1.5 rounded text-silver-500 hover:text-flame-600 hover:bg-silver-100">
                  {t.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(t)} title="Edit" className="p-1.5 rounded text-silver-500 hover:text-flame-600 hover:bg-silver-100">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(t)} title="Delete" className="p-1.5 rounded text-silver-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
