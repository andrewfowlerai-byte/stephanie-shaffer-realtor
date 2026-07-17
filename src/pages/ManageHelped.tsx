import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X, ShieldCheck } from 'lucide-react';
import {
  fetchHelpedStories,
  createHelpedStory,
  updateHelpedStory,
  deleteHelpedStory,
  type HelpedStory,
} from '../lib/helpedStories';

/**
 * CRM manager for the anonymized "Recently helped" stories shown on the public
 * site. Deliberately no fields for names, addresses, or photos, the tool itself
 * steers Stephanie toward compliant, anonymized entries.
 */
export default function ManageHelped() {
  const [stories, setStories] = useState<HelpedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HelpedStory | null>(null);
  const [summary, setSummary] = useState('');
  const [area, setArea] = useState('');
  const [year, setYear] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    setStories(await fetchHelpedStories());
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const resetForm = () => {
    setEditing(null); setSummary(''); setArea(''); setYear(''); setPublished(true); setError('');
  };
  const startEdit = (s: HelpedStory) => {
    setEditing(s); setSummary(s.summary); setArea(s.area ?? ''); setYear(s.year?.toString() ?? '');
    setPublished(s.published); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) { setError('Add a short summary of the move.'); return; }
    setSaving(true); setError('');
    const input = {
      summary: summary.trim(),
      area: area.trim() || null,
      year: year.trim() ? Number(year) : null,
      published,
      position: editing?.position ?? 0,
    };
    try {
      if (editing) await updateHelpedStory(editing.id, input);
      else await createHelpedStory(input);
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (s: HelpedStory) => { await updateHelpedStory(s.id, { published: !s.published }); refresh(); };
  const remove = async (s: HelpedStory) => { if (!confirm('Delete this entry?')) return; await deleteHelpedStory(s.id); refresh(); };

  const inputClass = 'w-full px-3 py-2 border border-silver-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-midnight-800 mb-1';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl text-midnight-900">Recently Helped</h1>
        <p className="text-sm text-silver-600 mt-0.5">Short, anonymized stories of moves you have guided. They show on your website as social proof.</p>
      </div>

      {/* Compliance guardrail */}
      <div className="flex items-start gap-2 rounded-xl border border-flame-200 bg-flame-50/60 px-4 py-3 text-sm text-midnight-800">
        <ShieldCheck className="w-4 h-4 text-flame-600 mt-0.5 flex-shrink-0" />
        <p>Keep these anonymized. No client names, addresses, or photos, just the situation and the area (for example, "Helped a first-time buyer find a home in Mentor").</p>
      </div>

      {/* Add / edit form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-silver-200 shadow-sm p-5 space-y-4">
        <div>
          <label className={labelClass}>What happened <span className="text-red-500">*</span></label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Helped a first-time buyer find a home in Mentor."
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Area (optional)</label>
            <input type="text" value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} placeholder="Mentor" />
          </div>
          <div>
            <label className={labelClass}>Year (optional)</label>
            <input type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(e.target.value)} className={inputClass} placeholder="2025" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 rounded border-silver-300 text-flame-600 focus:ring-flame-500" />
          <span className="text-sm font-medium text-midnight-800">Show on the website</span>
        </label>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            {saving ? 'Saving…' : editing ? 'Save changes' : <><Plus className="w-4 h-4" /> Add entry</>}
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
      ) : stories.length === 0 ? (
        <p className="text-sm text-silver-400">No entries yet. Add your first one above.</p>
      ) : (
        <ul className="space-y-2">
          {stories.map((s) => (
            <li key={s.id} className="bg-white rounded-xl border border-silver-200 p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-midnight-900">{s.summary}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {(s.area || s.year) && (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-silver-500">{[s.area, s.year].filter(Boolean).join(' · ')}</span>
                  )}
                  {!s.published && <span className="text-[10px] uppercase tracking-wider bg-silver-100 text-silver-600 border border-silver-200 px-1.5 py-0.5 rounded">Hidden</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => togglePublished(s)} title={s.published ? 'Hide from website' : 'Show on website'} className="p-1.5 rounded text-silver-500 hover:text-flame-600 hover:bg-silver-100">
                  {s.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(s)} title="Edit" className="p-1.5 rounded text-silver-500 hover:text-flame-600 hover:bg-silver-100">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(s)} title="Delete" className="p-1.5 rounded text-silver-400 hover:text-red-600 hover:bg-red-50">
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
