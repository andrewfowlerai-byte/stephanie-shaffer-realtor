/**
 * Public About page. Sprint 1 placeholder: her story, experience, and
 * philosophy get written with Stephanie in Sprint 2.
 */
export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">About</p>
      <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">
        Hi, I'm Stephanie.
      </h1>
      <div className="mt-8 space-y-5 text-lg text-silver-700 leading-relaxed">
        <p>
          This is a short placeholder for Stephanie's story. In Sprint 2 it becomes the real
          thing: how she got into real estate, what she loves about this community, and the way
          she works with the people she serves.
        </p>
        <p>
          Warm, professional, and locally rooted. That is the throughline, and it will come
          through in her own words here.
        </p>
      </div>

      <div className="mt-12 rounded-2xl border border-silver-200 bg-white p-7 shadow-sm">
        <h2 className="font-display text-xl text-midnight-900">My promise</h2>
        <p className="mt-2 text-sm text-silver-600 leading-relaxed">
          Honest advice, clear communication, and someone in your corner at every step. Placeholder
          copy for now, refined with Stephanie next sprint.
        </p>
      </div>
    </div>
  );
}
