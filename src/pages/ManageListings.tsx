import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, EyeOff, Home } from 'lucide-react';
import { fetchListings, deleteListing, formatPrice, type Listing } from '../lib/listings';
import ListingModal from '../components/ListingModal';

export default function ManageListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setListings(await fetchListings());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteListing(confirmDelete.id);
      setConfirmDelete(null);
      await refresh();
    } finally {
      setDeleting(false);
    }
  }

  const statusColor = (s: Listing['status']) =>
    s === 'Active' ? 'bg-emerald-100 text-emerald-700' : s === 'Pending' ? 'bg-flame-100 text-flame-700' : 'bg-silver-200 text-silver-700';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-midnight-900">Listings</h1>
          <p className="text-silver-500 text-sm mt-0.5">{listings.length} total. These show on the public website.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-flame-600 hover:bg-flame-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add listing
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin w-8 h-8 border-4 border-flame-600 border-t-transparent rounded-full" /></div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-silver-200 p-10 text-center">
          <Home className="w-8 h-8 text-flame-500 mx-auto" />
          <p className="mt-3 font-display text-lg text-midnight-900">No listings yet.</p>
          <p className="text-sm text-silver-500 mt-1">Add one and it appears on the website right away.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-silver-200 shadow-sm p-4 flex items-center gap-4">
              <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-midnight-800 to-brand-700">
                {l.photos?.[0] && <img src={l.photos[0]} alt={l.address} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-midnight-900 truncate">{l.address}</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor(l.status)}`}>{l.status}</span>
                  {!l.published && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-silver-100 text-silver-500">
                      <EyeOff className="w-3 h-3" /> Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-silver-500">
                  {[l.city, formatPrice(l.price), l.beds != null && `${l.beds} bd`, l.baths != null && `${l.baths} ba`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setEditing(l)} title="Edit" className="p-1.5 rounded-lg hover:bg-flame-50 hover:text-flame-600 text-silver-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(l)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-silver-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <ListingModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {editing && <ListingModal listing={editing} onClose={() => setEditing(null)} onSaved={refresh} />}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-silver-200 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-midnight-900 mb-2">Delete listing</h3>
            <p className="text-silver-500 text-sm mb-6">Delete <strong>{confirmDelete.address}</strong>? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-silver-600 hover:bg-silver-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors">{deleting ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
