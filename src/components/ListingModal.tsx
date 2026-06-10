import { useState, type FormEvent } from 'react';
import { X, ImagePlus, Trash2 } from 'lucide-react';
import type { Listing, ListingInput, ListingStatus } from '../lib/listings';
import { createListing, updateListing, uploadListingPhoto } from '../lib/listings';

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

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) urls.push(await uploadListingPhoto(file));
      setPhotos((p) => [...p, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
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
          {/* Photos */}
          <div>
            <label className={labelClass}>Photos</label>
            <div className="flex flex-wrap gap-3">
              {photos.map((url, i) => (
                <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-silver-200">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((u) => u !== url))} className="absolute top-1 right-1 p-1 rounded-md bg-black/50 text-white hover:bg-black/70" aria-label="Remove photo">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-silver-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-flame-400 hover:bg-flame-50/30 transition-colors text-silver-500">
                {uploading ? <span className="w-5 h-5 border-2 border-flame-600 border-t-transparent rounded-full animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                <span className="text-[10px]">{uploading ? 'Uploading' : 'Add'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>
            </div>
            <p className="text-[11px] text-silver-400 mt-1.5">The first photo is the cover. Drag-to-reorder is coming later; for now upload in the order you want.</p>
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
