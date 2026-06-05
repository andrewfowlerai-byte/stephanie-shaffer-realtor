/**
 * Public Listings page. Sprint 1 placeholder. Sprint 2 builds the
 * manually-managed gallery (Supabase `listings` table + storage images);
 * an IDX feed stays optional, gated on the Sprint 0 MLS discovery.
 */
export default function Listings() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Listings</p>
      <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">
        Homes worth coming home to.
      </h1>
      <p className="mt-5 text-lg text-silver-600 max-w-xl leading-relaxed">
        Current and recent listings will live here. The gallery goes live in Sprint 2.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-silver-200 bg-white overflow-hidden shadow-sm">
            <div className="aspect-[4/3] bg-gradient-to-br from-silver-200 to-silver-300" />
            <div className="p-5">
              <p className="font-display text-lg text-midnight-900">Coming soon</p>
              <p className="text-sm text-silver-500 mt-1">Address, price, and photos on the way.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
