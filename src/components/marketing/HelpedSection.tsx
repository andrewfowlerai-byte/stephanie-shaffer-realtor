import { useEffect, useState } from 'react';
import { Handshake } from 'lucide-react';
import { fetchHelpedStories, type HelpedStory } from '../../lib/helpedStories';

/** Public "Recently helped" band: anonymized stories of moves Stephanie has
 *  guided. Hidden entirely until there is at least one published story, so the
 *  site never shows an empty section. */
export default function HelpedSection() {
  const [stories, setStories] = useState<HelpedStory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHelpedStories({ publishedOnly: true })
      .then((s) => { if (!cancelled) { setStories(s); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  if (!loaded || stories.length === 0) return null;

  return (
    <section className="bg-white border-y border-silver-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-2">Recently helped</p>
        <h2 className="font-display text-3xl text-midnight-900">A few of the moves I have guided.</h2>
        <p className="mt-3 text-silver-600 max-w-2xl leading-relaxed">
          Real people, real moves across Northeast Ohio. Names are kept private, out of respect for my clients.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <div key={s.id} className="rounded-2xl border border-silver-200 bg-silver-50/50 p-5">
              <div className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center">
                <Handshake className="w-5 h-5" />
              </div>
              <p className="mt-3 text-midnight-900 leading-snug">{s.summary}</p>
              {(s.area || s.year) && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-silver-500">
                  {[s.area, s.year].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
