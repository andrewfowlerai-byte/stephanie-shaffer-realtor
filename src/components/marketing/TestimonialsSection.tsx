import { useEffect, useState, type CSSProperties } from 'react';
import { Star, Quote } from 'lucide-react';
import { fetchTestimonials, type Testimonial } from '../../lib/testimonials';

/** Show "First L." instead of the full surname, for client privacy. */
function displayName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return full;
  const last = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(' ')} ${last[0]}.`;
}

function Stars({ n, className = 'w-4 h-4' }: { n: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5 text-flame-500" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: Math.max(0, Math.min(5, n)) }).map((_, i) => (
        <Star key={i} className={`${className} fill-current`} />
      ))}
    </div>
  );
}

/** One uniform, fixed-size review card. Long reviews clamp so every card is
 *  identical in size; short ones pin the name to the bottom. */
function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="relative flex-shrink-0 w-[300px] sm:w-[340px] h-72 rounded-2xl border border-silver-200 bg-white p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <Quote className="absolute top-5 right-5 w-6 h-6 text-silver-200" aria-hidden="true" />
      <Stars n={t.rating ?? 5} />
      <blockquote className="mt-3 text-midnight-800 leading-relaxed text-[15px] flex-1 overflow-hidden line-clamp-5">
        {t.quote}
      </blockquote>
      <figcaption className="mt-4 pt-3 border-t border-silver-100">
        <p className="font-semibold text-midnight-900 text-sm">{displayName(t.name)}</p>
        {t.relationship && (
          <p className="text-[11px] uppercase tracking-wide text-flame-600 mt-0.5">{t.relationship}</p>
        )}
      </figcaption>
    </figure>
  );
}

/** Public client-reviews band: a smooth right-to-left marquee of uniform cards.
 *  Hidden until at least one review is published. */
export default function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTestimonials({ publishedOnly: true })
      .then((t) => { if (!cancelled) { setItems(t); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  if (!loaded || items.length === 0) return null;

  const count = items.length;
  const avg = items.reduce((s, t) => s + (t.rating ?? 5), 0) / count;
  // Duplicate the list so the track can loop seamlessly at translateX(-50%).
  const loop = [...items, ...items];
  const duration = Math.max(24, count * 6); // ~constant scroll speed regardless of count

  return (
    <section className="bg-silver-50 border-y border-silver-200 py-16 overflow-hidden">
      <style>{`
        @keyframes ss-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ss-marquee-track { animation: ss-marquee var(--ss-dur, 60s) linear infinite; will-change: transform; }
        .ss-marquee-viewport:hover .ss-marquee-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .ss-marquee-viewport { overflow-x: auto; }
          .ss-marquee-track { animation: none; }
        }
      `}</style>

      {/* Heading */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-2">Client reviews</p>
        <h2 className="font-display text-3xl text-midnight-900">What clients say.</h2>
        <p className="mt-2 text-silver-600 max-w-2xl leading-relaxed">
          Buyers and sellers across Lake, Geauga, Ashtabula, and Trumbull counties, in their own words.
        </p>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Stars n={Math.round(avg)} />
          <span className="text-sm font-semibold text-midnight-900">{avg.toFixed(1)} average</span>
          <span className="text-sm text-silver-500">from {count} client review{count === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative mt-9">
        <div className="ss-marquee-viewport overflow-hidden">
          <div
            className="ss-marquee-track flex gap-5 w-max"
            style={{ '--ss-dur': `${duration}s` } as CSSProperties}
          >
            {loop.map((t, i) => <Card key={`${t.id}-${i}`} t={t} />)}
          </div>
        </div>
        {/* Soft edges so cards fade in and out of view */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-silver-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-silver-50 to-transparent" />
      </div>
    </section>
  );
}
