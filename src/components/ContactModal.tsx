import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Contact, Stage, Tier, Platform, Service } from '../lib/types';
import { STAGES, TIER_DETAILS, PLATFORMS, SERVICES, SOURCES } from '../lib/constants';
import LocationAutocomplete from './LocationAutocomplete';
import { useLocalDraft, clearLocalDrafts } from '../hooks/useLocalDraft';

interface ContactModalProps {
  contact?: Contact | null;
  initialStage?: Stage;
  onSave: (data: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
  onUpdate?: (id: string, data: Partial<Contact>) => Promise<void>;
  onClose: () => void;
}

const emptyForm = (): Omit<Contact, 'id' | 'created_at'> => ({
  business_name: '',
  contact_name: '',
  email: '',
  phone: '',
  industry: '',
  stage: 'Prospect',
  tier: undefined,
  platforms: [],
  services: [],
  monthly_value: undefined,
  one_time_value: undefined,
  blog_addons: 0,
  notes: '',
  next_followup: '',
  source: '',
  onboarded: false,
  pages_converted: false,
  location: '',
  local_spots: [],
});

export default function ContactModal({ contact, initialStage, onSave, onUpdate, onClose }: ContactModalProps) {
  // Draft scope: per-contact when editing, single 'new' bucket when adding.
  // A tab-switch mid-draft restores the right form on rehydrate, and we
  // wipe the key on successful save so the next 'new' starts clean.
  const draftKey = contact ? `contact-edit.${contact.id}` : 'contact-new';

  const initialForm = (): Omit<Contact, 'id' | 'created_at'> => {
    if (contact) {
      const { id, created_at, ...rest } = contact;
      void id; void created_at;
      return {
        ...emptyForm(),
        ...rest,
        platforms: rest.platforms ?? [],
        services: rest.services ?? [],
        blog_addons: rest.blog_addons ?? 0,
        onboarded: rest.onboarded ?? false,
        pages_converted: rest.pages_converted ?? false,
        location: rest.location ?? '',
        local_spots: rest.local_spots ?? [],
      };
    }
    return initialStage ? { ...emptyForm(), stage: initialStage } : emptyForm();
  };

  const [form, setForm] = useLocalDraft<Omit<Contact, 'id' | 'created_at'>>(draftKey, initialForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [localSpotInput, setLocalSpotInput] = useState('');

  const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleTierChange = (val: string) => {
    if (val === '') {
      setField('tier', undefined);
      setField('monthly_value', undefined);
    } else {
      const t = Number(val) as Tier;
      setField('tier', t);
      const base = TIER_DETAILS[t].price;
      const blogCost = (form.blog_addons ?? 0) * 50;
      setField('monthly_value', base + blogCost);
    }
  };

  const handleBlogAddonsChange = (val: number) => {
    setField('blog_addons', val);
    if (form.tier) {
      const base = TIER_DETAILS[form.tier].price;
      setField('monthly_value', base + val * 50);
    }
  };

  const togglePlatform = (p: Platform) => {
    const current = form.platforms ?? [];
    setField('platforms', current.includes(p) ? current.filter((x) => x !== p) : [...current, p]);
  };

  const toggleService = (s: Service) => {
    const current = form.services ?? [];
    setField('services', current.includes(s) ? current.filter((x) => x !== s) : [...current, s]);
  };

  const addLocalSpot = () => {
    const val = localSpotInput.trim();
    if (!val) return;
    setField('local_spots', [...(form.local_spots ?? []), val]);
    setLocalSpotInput('');
  };

  const removeLocalSpot = (index: number) => {
    setField('local_spots', (form.local_spots ?? []).filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.contact_name.trim()) {
      setError('Contact Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        business_name: form.business_name || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        industry: form.industry || undefined,
        notes: form.notes || undefined,
        next_followup: form.next_followup || undefined,
        source: form.source || undefined,
        location: form.location || undefined,
        local_spots: form.local_spots && form.local_spots.length > 0 ? form.local_spots : undefined,
      };
      if (contact && onUpdate) {
        await onUpdate(contact.id, payload);
      } else {
        await onSave(payload);
      }
      // Successful save — wipe the draft so the next new-contact form
      // doesn't pre-fill with this one's data.
      clearLocalDrafts(draftKey);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save contact.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const estimatedValue = form.tier
    ? TIER_DETAILS[form.tier].price + (form.blog_addons ?? 0) * 50
    : form.monthly_value ?? 0;

  // Service Tier and Monthly Value only show when the contact's selected
  // services actually warrant them. Tier is tied to Social Media Management
  // pricing; Monthly Value applies anytime there's a paid service in scope.
  const selectedServices = form.services ?? [];
  const hasAnyService = selectedServices.length > 0;
  const hasSMM = selectedServices.includes('Social Media Management');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Business & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => setField('business_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                placeholder="Acme Real Estate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setField('contact_name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                placeholder="jane@acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone ?? ''}
                onChange={(e) => setField('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          {/* Industry & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                value={form.industry ?? ''}
                onChange={(e) => setField('industry', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                placeholder="Real Estate"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <LocationAutocomplete
                value={form.location ?? ''}
                onChange={(v) => setField('location', v)}
                placeholder="Cleveland, OH"
              />
            </div>
          </div>

          {/* Stage & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setField('stage', e.target.value as Stage)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent bg-white"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select
                value={form.source ?? ''}
                onChange={(e) => setField('source', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent bg-white"
              >
                <option value="">Select source</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Local Content Spots */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Local Spots to Visit
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Add a few local businesses or landmarks near this client (useful for content references later).
            </p>

            {/* Manual add */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={localSpotInput}
                onChange={(e) => setLocalSpotInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLocalSpot(); } }}
                placeholder="e.g. Lola Bistro, West Side Market…"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addLocalSpot}
                className="px-3 py-2 bg-slate-100 hover:bg-flame-50 hover:text-flame-700 text-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>

            {/* Added spots */}
            {(form.local_spots ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(form.local_spots ?? []).map((spot, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    {spot}
                    <button
                      type="button"
                      onClick={() => removeLocalSpot(i)}
                      className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors leading-none"
                      aria-label={`Remove ${spot}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Services — pick first; the tier and monthly value fields below adapt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Services</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.services ?? []).includes(s)}
                    onChange={() => toggleService(s)}
                    className="w-4 h-4 rounded border-slate-300 text-flame-600 focus:ring-flame-500"
                  />
                  <span className="text-sm text-slate-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Service Tier — only shown when Social Media Management is in services */}
          {hasSMM && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Tier</label>
                <select
                  value={form.tier ?? ''}
                  onChange={(e) => handleTierChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent bg-white"
                >
                  <option value="">None</option>
                  {([1, 2, 3] as const).map((t) => (
                    <option key={t} value={t}>{TIER_DETAILS[t].label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Blog Add-ons (only Tier 1) */}
          {hasSMM && form.tier === 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Blog Post Add-ons (+$50/mo each)
              </label>
              <input
                type="number"
                min={0}
                max={5}
                value={form.blog_addons ?? 0}
                onChange={(e) => handleBlogAddonsChange(Number(e.target.value))}
                className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
              />
            </div>
          )}

          {/* One-Time + Monthly Value side by side (only when there's a paid service). */}
          {hasAnyService && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  One-Time Value ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.one_time_value ?? ''}
                  onChange={(e) => setField('one_time_value', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-[11px] text-slate-400 mt-1">Project / setup fees (e.g. website design).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Monthly Value ($)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.monthly_value ?? ''}
                  onChange={(e) => setField('monthly_value', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-[11px] text-slate-400 mt-1">Recurring retainer (e.g. SMM tier).</p>
              </div>
            </div>
          )}

          {/* Next Follow-up — always available. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Next Follow-up</label>
              <input
                type="date"
                value={form.next_followup ?? ''}
                onChange={(e) => setField('next_followup', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.platforms ?? []).includes(p)}
                    onChange={() => togglePlatform(p)}
                    className="w-4 h-4 rounded border-slate-300 text-flame-600 focus:ring-flame-500"
                  />
                  <span className="text-sm text-slate-700">{p}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent resize-none"
              placeholder="Any relevant notes..."
            />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.onboarded ?? false}
                onChange={(e) => setField('onboarded', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-flame-600 focus:ring-flame-500"
              />
              <span className="text-sm font-medium text-slate-700">Onboarded</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pages_converted ?? false}
                onChange={(e) => setField('pages_converted', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-flame-600 focus:ring-flame-500"
              />
              <span className="text-sm font-medium text-slate-700">Personal pages converted to Business</span>
            </label>
          </div>

          {/* Estimated value summary */}
          {(form.tier || (form.monthly_value ?? 0) > 0 || (form.one_time_value ?? 0) > 0) && (
            <div className="bg-flame-50 border border-flame-100 rounded-xl px-4 py-3 space-y-1">
              {(form.tier || (form.monthly_value ?? 0) > 0) && (
                <p className="text-sm font-medium text-flame-700">
                  Est. Monthly Value: ${estimatedValue.toLocaleString()}
                  {form.tier && form.tier === 1 && (form.blog_addons ?? 0) > 0 && (
                    <span className="text-flame-500 font-normal ml-2">
                      (${TIER_DETAILS[1].price} base + ${(form.blog_addons ?? 0) * 50} blog add-ons)
                    </span>
                  )}
                </p>
              )}
              {(form.one_time_value ?? 0) > 0 && (
                <p className="text-sm font-medium text-flame-700">
                  One-Time Value: ${(form.one_time_value ?? 0).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit}
            disabled={saving}
            className="bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            {saving ? 'Saving…' : contact ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
