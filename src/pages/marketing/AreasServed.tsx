/**
 * Public Areas Served page. Sprint 1 placeholder. Sprint 2 adds the real
 * towns and neighborhoods with a small map per area.
 */
export default function AreasServed() {
  const placeholders = ['Neighborhood one', 'Neighborhood two', 'Neighborhood three', 'Neighborhood four'];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Areas Served</p>
      <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">
        Where I know the streets.
      </h1>
      <p className="mt-5 text-lg text-silver-600 max-w-xl leading-relaxed">
        The towns and neighborhoods Stephanie serves, each with a quick map, arrive in Sprint 2.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {placeholders.map((name) => (
          <div key={name} className="rounded-2xl border border-silver-200 bg-white overflow-hidden shadow-sm">
            <div className="h-40 bg-gradient-to-br from-brand-100 to-silver-200" />
            <div className="p-6">
              <h2 className="font-display text-xl text-midnight-900">{name}</h2>
              <p className="text-sm text-silver-500 mt-1">A short, warm description goes here.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
