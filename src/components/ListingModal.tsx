import { useState, type FormEvent } from 'react';
import { X, ImagePlus, Trash2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Listing, ListingInput, ListingStatus } from '../lib/listings';
import { createListing, updateListing, uploadListingPhoto, parseListingSource } from '../lib/listings';

const STATUSES: ListingStatus[] = ['Active', 'Pending', 'Sold'];

interface Props {
  listing?: Listing | null;
  onClose: () => void;
  onSaved: () => void;
}

const num = (s: string): number | null => {
  const n = Number(s);
  return s.trim() === '' || isNaN(n) ? null : n;
};

export default function ListingModal({ listing, onClose, onSaved }: Props) {
  const [status, setStatus] = useState<ListingStatus>(listing?.status ?? 'Active');
  const [address, setAddress] = useState(listing?.address ?? '');
  const [city, setCity] = useState(listing?.city ?? '');
  const [price, setPrice] = useState(listing?.price?.toString() ?? '');
  const [beds, setBeds] = useState(listing?.beds?.toString() ?? '');
  const [baths, setBaths] = useState(listing?.baths?.toString() ?? '');
  const [sqft, setSqft] = useState(listing?.sqft?.toString() ?? '');
  const [mls, setMls] = useState(listing?.mls ?? '');
  const [description, setDescription] = useState(listing?.description ?? '');
  const [published, setPublished] = useState(listing?.published ?? true);
  const [photos, setPhotos] = useState<string[]>(listing?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [quick, setQuick] = useState('');
  const [filling, setFilling] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [photoMsg, setPhotoMsg] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function runQuickFill() {
    const v = quick.trim();
    if (!v) return;
    setFilling(true);
    setQuickNote('');
    setError('');
    try {
      const isUrl = /^https?:\/\/\S+$/i.test(v);
      const { fields, note } = await parseListingSource(isUrl ? { url: v } : { text: v });
      if (fields.status && STATUSES.includes(fields.status as ListingStatus)) setStatus(fields.status as ListingStatus);
      if (fields.address) setAddress(fields.address);
      if (fields.city) setCity(fields.city);
      if (fields.price != null) setPrice(String(fields.price));
      if (fields.beds != null) setBeds(String(fields.beds));
      if (fields.baths != null) setBaths(String(fields.baths));
      if (fields.sqft != null) setSqft(String(fields.sqft));
      if (fields.mls) setMls(fields.mls);
      if (fields.description) setDescription(fields.description);
      const applied = Object.values(fields).filter((v) => v != null && v !== '').length;
      if (note) setQuickNote(note);
      else if (applied === 0) setQuickNote("I couldn't find listing details there. Paste the listing details, or a public listing link, and try again.");
      else setQuickNote('Filled in what I could. Review the fields, add photos, and save.');
    } catch (err) {
      setQuickNote(err instanceof Error ? err.message : 'Could not read that.');
    } finally {
      setFilling(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setPhotoMsg('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) { setPhotoMsg(`${file.name} is not an image, skipped.`); continue; }
        urls.push(await uploadListingPhoto(file));
      }
      if (urls.length) setPhotos((p) => [...p, ...urls]);
    } catch (err) {
      setPhotoMsg(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function movePhoto(from: number, to: number) {
    setPhotos((p) => {
      if (to < 0 || to >= p.length || from === to) return p;
      const next = [...p];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address.trim()) { setError('Address is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const input: ListingInput = {
        status,
        address: address.trim(),
        city: city.trim() || null,
        price: num(price),
        beds: num(beds),
        baths: num(baths),
        sqft: num(sqft),
        mls: mls.trim() || null,
        description: description.trim() || null,
        photos,
        published,
        position: listing?.position ?? 0,
      };
      if (listing) await updateListing(listing.id, input);
      else await createListing(input);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-silver-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-silver-200">
          <h2 className="text-lg font-semibold text-midnight-900">{listing ? 'Edit listing' : 'Add listing'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-silver-100 transition-colors"><X className="w-5 h-5 text-silver-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Quick fill */}
          <div className="rounded-xl border border-flame-200 bg-flame-50/50 p-4">
            <label className="block text-sm font-semibold text-midnight-800 mb-1">Quick fill</label>
            <p className="text-xs text-silver-500 mb-2">Paste a listing link, or copy the listing details, and I'll fill in what I can. The description is copied exactly as written, never rewritten. Then review, add photos, and save.</p>
            <textarea
              value={quick}
              onChange={(e) => setQuick(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Paste a listing link, or the details (address, price, beds, baths, description)..."
            />
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <button
                type="button"
                onClick={runQuickFill}
                disabled={filling || !quick.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-flame-600 hover:bg-flame-700 disabled:opacity-50 text-white transition-colors"
              >
                {filling ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Reading…</> : <><Sparkles className="w-3.5 h-3.5" /> Fill in the form</>}
              </button>
              {quickNote && <span className="text-xs text-silver-600">{quickNote}</span>}
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className={labelClass}>Photos</label>
            <div className="flex flex-wrap gap-3">
              {photos.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIndex !== null) movePhoto(dragIndex, i); setDragIndex(null); }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`group relative w-24 h-24 rounded-lg overflow-hidden border border-silver-200 cursor-move transition-opacity ${dragIndex === i ? 'opacity-40' : ''}`}
                  title="Drag to reorder"
                >
                  <img src={url} alt={`Photo ${i + 1}`} draggable={false} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[8px] font-semibold uppercase tracking-wide bg-flame-600 text-white px-1.5 py-0.5 rounded">Cover</span>
                  )}
                  <button type="button" onClick={() => setPhotos((p) => p.filter((u) => u !== url))} className="absolute top-1 right-1 p-1 rounded-md bg-black/50 text-white hover:bg-black/70" aria-label="Remove photo">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 flex justify-between px-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" disabled={i === 0} onClick={() => movePhoto(i, i - 1)} className="p-0.5 rounded bg-black/55 text-white hover:bg-black/75 disabled:opacity-0" aria-label="Move earlier">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" disabled={i === photos.length - 1} onClick={() => movePhoto(i, i + 1)} className="p-0.5 rounded bg-black/55 text-white hover:bg-black/75 disabled:opacity-0" aria-label="Move later">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-silver-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-flame-400 hover:bg-flame-50/30 transition-colors text-silver-500">
                {uploading ? <span className="w-5 h-5 border-2 border-flame-600 border-t-transparent rounded-full animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                <span className="text-[10px]">{uploading ? 'Uploading' : 'Add'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>
            </div>
            <p className="text-[11px] text-silver-400 mt-1.5">The first photo is the cover on the website. Drag a photo to reorder, or use the arrows that appear on each one.</p>
            {photoMsg && <p className="text-xs text-red-600 mt-2">{photoMsg}</p>}
          </div>

          {/* Address + city */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Address <span className="text-red-500">*</span></label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className={inputClass} placeholder="123 Main St" />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Mentor, OH" />
            </div>
          </div>

          {/* Status + price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)} className={`${inputClass} bg-white`}>
                {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Price ($)</label>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="375000" />
            </div>
          </div>

          {/* Beds / baths / sqft */}
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Beds</label><input type="number" min={0} value={beds} onChange={(e) => setBeds(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Baths</label><input type="number" min={0} step="0.5" value={baths} onChange={(e) => setBaths(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Sq ft</label><input type="number" min={0} value={sqft} onChange={(e) => setSqft(e.target.value)} className={inputClass} /></div>
          </div>

          {/* MLS */}
          <div>
            <label className={labelClass}>MLS number (optional)</label>
            <input type="text" value={mls} onChange={(e) => setMls(e.target.value)} className={inputClass} placeholder="e.g. 5012345" />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder="A warm, inviting description of the home." />
          </div>

          {/* Published */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 rounded border-silver-300 text-flame-600 focus:ring-flame-500" />
            <span className="text-sm font-medium text-midnight-800">Published (visible on the website)</span>
          </label>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-silver-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-silver-600 hover:text-midnight-900 hover:bg-silver-100 rounded-lg transition-colors">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={saving || uploading} className="bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
            {saving ? 'Saving…' : listing ? 'Save changes' : 'Add listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
