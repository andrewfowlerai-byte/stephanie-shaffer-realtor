import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users, Megaphone, GitBranch, Sparkles } from 'lucide-react';
import { listCampaigns, deleteCampaign, updateCampaign, enrollByCategory, CAMPAIGN_TEMPLATES, type Campaign, type CampaignTemplate } from '../lib/campaigns';
import { CATEGORIES } from '../lib/constants';
import type { Category } from '../lib/types';
import CampaignModal from '../components/CampaignModal';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createTemplate, setCreateTemplate] = useState<CampaignTemplate | null>(null);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Campaign | null>(null);
  const [enrollCat, setEnrollCat] = useState<Record<string, Category | ''>>({});
  const [enrollMsg, setEnrollMsg] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setCampaigns(await listCampaigns());
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  function openNew(template: CampaignTemplate | null) {
    setCreateTemplate(template);
    setShowCreate(true);
  }

  async function handleEnroll(c: Campaign) {
    const cat = enrollCat[c.id];
    if (!cat) return;
    try {
      const n = await enrollByCategory(c, cat);
      setEnrollMsg((m) => ({ ...m, [c.id]: `Enrolled ${n} new ${cat} contact${n === 1 ? '' : 's'}.` }));
      await refresh();
      setTimeout(() => setEnrollMsg((m) => ({ ...m, [c.id]: '' })), 4000);
    } catch {
      setEnrollMsg((m) => ({ ...m, [c.id]: 'Enroll failed.' }));
    }
  }

  async function toggleActive(c: Campaign) {
    await updateCampaign(c.id, { active: !c.active });
    refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    await deleteCampaign(confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">Campaigns</h1>
          <p className="text-silver-500 text-sm mt-0.5">Drip sequences and broadcasts. Touches surface on the Follow-ups page to send.</p>
        </div>
        <button onClick={() => openNew(null)} className="inline-flex items-center gap-1.5 bg-flame-600 hover:bg-flame-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> New campaign
        </button>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-2xl border border-silver-200 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-silver-400 mb-3">Start from a template</p>
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN_TEMPLATES.map((t) => (
            <button key={t.name} onClick={() => openNew(t)} title={t.description} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-silver-200 text-midnight-700 hover:border-flame-400 hover:bg-flame-50/40 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-flame-600" /> {t.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-4 border-flame-600 border-t-transparent rounded-full" /></div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-silver-200 p-10 text-center">
          <Megaphone className="w-8 h-8 text-flame-500 mx-auto" />
          <p className="mt-3 font-display text-lg text-midnight-900">No campaigns yet.</p>
          <p className="text-sm text-silver-500 mt-1">Start from a template above, or build one from scratch.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-silver-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.type === 'broadcast' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.type === 'broadcast' ? <Megaphone className="w-3 h-3" /> : <GitBranch className="w-3 h-3" />}
                      {c.type === 'broadcast' ? 'Broadcast' : 'Sequence'}
                    </span>
                    <p className="font-semibold text-midnight-900 truncate">{c.name}</p>
                    {!c.active && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-silver-100 text-silver-500">Paused</span>}
                  </div>
                  {c.description && <p className="text-sm text-silver-500 mt-1">{c.description}</p>}
                  <p className="text-xs text-silver-500 mt-2 flex items-center gap-3">
                    <span>{c.steps.length} step{c.steps.length === 1 ? '' : 's'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.enrolledCount ?? 0} enrolled</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleActive(c)} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-silver-200 text-midnight-700 hover:bg-silver-100 transition-colors">{c.active ? 'Pause' : 'Resume'}</button>
                  <button onClick={() => setEditing(c)} title="Edit" className="p-1.5 rounded-lg hover:bg-flame-50 hover:text-flame-600 text-silver-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmDelete(c)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-silver-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-silver-100 flex-wrap">
                <span className="text-xs text-silver-500">Enroll a category:</span>
                <select value={enrollCat[c.id] ?? ''} onChange={(e) => setEnrollCat((m) => ({ ...m, [c.id]: e.target.value as Category | '' }))} className="px-2 py-1 border border-silver-200 rounded-md text-sm bg-white">
                  <option value="">Choose…</option>
                  {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
                <button onClick={() => handleEnroll(c)} disabled={!enrollCat[c.id]} className="px-3 py-1 rounded-md text-xs font-semibold bg-flame-600 hover:bg-flame-700 disabled:opacity-50 text-white transition-colors">Enroll</button>
                {enrollMsg[c.id] && <span className="text-xs text-green-700">{enrollMsg[c.id]}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CampaignModal template={createTemplate} onClose={() => setShowCreate(false)} onSaved={refresh} />}
      {editing && <CampaignModal campaign={editing} onClose={() => setEditing(null)} onSaved={refresh} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-silver-200 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-midnight-900 mb-2">Delete campaign</h3>
            <p className="text-silver-500 text-sm mb-6">Delete <strong>{confirmDelete.name}</strong> and all its enrollments? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-silver-600 hover:bg-silver-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
