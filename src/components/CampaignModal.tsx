import { useState, type FormEvent } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Campaign, CampaignType, CampaignChannel, StepDraftType, CampaignTemplate } from '../lib/campaigns';
import { createCampaign, updateCampaign } from '../lib/campaigns';

type StepDraft = { day_offset: number; channel: CampaignChannel; draft_type: StepDraftType; prompt: string; body: string };

const CHANNELS: { value: CampaignChannel; label: string }[] = [
  { value: 'email', label: 'Email' }, { value: 'text', label: 'Text' }, { value: 'call', label: 'Call' }, { value: 'task', label: 'Task' },
];
const TONES: { value: StepDraftType; label: string }[] = [
  { value: 'intro', label: 'Intro' }, { value: 'follow_up', label: 'Follow-up' }, { value: 'check_in', label: 'Check-in' },
  { value: 'birthday', label: 'Birthday' }, { value: 'anniversary', label: 'Anniversary' },
];

interface Props {
  campaign?: Campaign | null;
  template?: CampaignTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CampaignModal({ campaign, template, onClose, onSaved }: Props) {
  const init = campaign ?? template;
  const [name, setName] = useState(init?.name ?? '');
  const [description, setDescription] = useState(init?.description ?? '');
  const [type, setType] = useState<CampaignType>(init?.type ?? 'sequence');
  const [steps, setSteps] = useState<StepDraft[]>(
    (init?.steps && init.steps.length > 0 ? init.steps : [{ position: 0, day_offset: 0, channel: 'email' as CampaignChannel, draft_type: 'check_in' as StepDraftType, subject: null, body: null, prompt: '' }])
      .map((s) => ({ day_offset: s.day_offset, channel: s.channel, draft_type: s.draft_type, prompt: s.prompt ?? '', body: s.body ?? '' })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isBroadcast = type === 'broadcast';

  function setStep(i: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addStep() {
    setSteps((prev) => [...prev, { day_offset: (prev[prev.length - 1]?.day_offset ?? 0) + 7, channel: 'email', draft_type: 'check_in', prompt: '', body: '' }]);
  }
  function removeStep(i: number) {
    setSteps((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const src = isBroadcast ? steps.slice(0, 1).map((s) => ({ ...s, day_offset: 0 })) : steps;
      const payloadSteps = src.map((s, i) => {
        const isTask = s.channel === 'task';
        return {
          position: i,
          day_offset: s.day_offset,
          channel: s.channel,
          draft_type: s.draft_type,
          subject: null,
          body: isTask ? (s.body.trim() || null) : null,
          prompt: isTask ? null : (s.prompt.trim() || null),
        };
      });
      if (campaign) await updateCampaign(campaign.id, { name: name.trim(), description: description.trim() || null, type }, payloadSteps);
      else await createCampaign({ name: name.trim(), description: description.trim() || null, type }, payloadSteps);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full px-3 py-2 border border-silver-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-midnight-800 mb-1';
  const visibleSteps = isBroadcast ? steps.slice(0, 1) : steps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-silver-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-silver-200">
          <h2 className="text-lg font-semibold text-midnight-900">{campaign ? 'Edit campaign' : 'New campaign'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-silver-100 transition-colors"><X className="w-5 h-5 text-silver-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div>
            <label className={labelClass}>Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="New Lead Nurture" />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="What this campaign is for." />
          </div>

          <div>
            <label className={labelClass}>Type</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('sequence')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${type === 'sequence' ? 'border-flame-500 bg-flame-50 text-flame-700' : 'border-silver-200 text-silver-600'}`}>
                Sequence (drip over time)
              </button>
              <button type="button" onClick={() => setType('broadcast')} className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${type === 'broadcast' ? 'border-flame-500 bg-flame-50 text-flame-700' : 'border-silver-200 text-silver-600'}`}>
                Broadcast (one message)
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-midnight-800">{isBroadcast ? 'Message' : 'Steps'}</label>
              {!isBroadcast && (
                <button type="button" onClick={addStep} className="inline-flex items-center gap-1 text-xs font-semibold text-flame-600 hover:text-flame-700"><Plus className="w-3.5 h-3.5" /> Add step</button>
              )}
            </div>
            <div className="space-y-3">
              {visibleSteps.map((s, i) => (
                <div key={i} className="rounded-xl border border-silver-200 bg-silver-50 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isBroadcast && (
                      <label className="flex items-center gap-1.5 text-xs text-silver-600">
                        Day
                        <input type="number" min={0} value={s.day_offset} onChange={(e) => setStep(i, { day_offset: Number(e.target.value) })} className="w-16 px-2 py-1 border border-silver-200 rounded-md text-sm" />
                      </label>
                    )}
                    <select value={s.channel} onChange={(e) => setStep(i, { channel: e.target.value as CampaignChannel })} className="px-2 py-1 border border-silver-200 rounded-md text-sm bg-white">
                      {CHANNELS.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
                    </select>
                    {s.channel === 'task' ? (
                      <span className="text-xs font-medium text-flame-600">To-do, no message sent</span>
                    ) : (
                      <select value={s.draft_type} onChange={(e) => setStep(i, { draft_type: e.target.value as StepDraftType })} className="px-2 py-1 border border-silver-200 rounded-md text-sm bg-white">
                        {TONES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                      </select>
                    )}
                    {!isBroadcast && visibleSteps.length > 1 && (
                      <button type="button" onClick={() => removeStep(i)} className="ml-auto p-1.5 rounded-md text-silver-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  {s.channel === 'task' ? (
                    <input type="text" value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} className={`${inputClass} mt-2`} placeholder="What to do (e.g. Pop by with a small gift, or hand-write a card)." />
                  ) : (
                    <textarea value={s.prompt} onChange={(e) => setStep(i, { prompt: e.target.value })} rows={2} className={`${inputClass} mt-2 resize-none`} placeholder="Guidance for the AI draft (what this message should say)." />
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-silver-400 mt-2">Each touch is AI-drafted in her voice when it comes due. She reviews and sends it.</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-silver-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-silver-600 hover:text-midnight-900 hover:bg-silver-100 rounded-lg transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">{saving ? 'Saving…' : campaign ? 'Save changes' : 'Create campaign'}</button>
        </div>
      </div>
    </div>
  );
}
