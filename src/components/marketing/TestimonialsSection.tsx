import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { fetchTestimonials, type Testimonial } from '../../lib/testimonials';

/** Public client-reviews band. Hidden until at least one testimonial is
 *  published, so the site never shows an empty section. */
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

  return (
    <section className="bg-silver-50 border-y border-silver-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-2">Client reviews</p>
        <h2 className="font-display text-3xl text-midnight-900">What clients say.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {items.map((t) => (
            <figure key={t.id} className="rounded-2xl border border-silver-200 bg-white p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-0.5 text-flame-500 mb-3" aria-label={`${t.rating ?? 5} out of 5 stars`}>
                {Array.from({ length: Math.max(0, Math.min(5, t.rating ?? 5)) }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <Quote className="w-5 h-5 text-silver-300 mb-2" aria-hidden="true" />
              <blockquote className="text-midnight-800 leading-relaxed whitespace-pre-line flex-1">{t.quote}</blockquote>
              <figcaption className="mt-4 pt-3 border-t border-silver-100">
                <p className="font-semibold text-midnight-900 text-sm">{t.name}</p>
                {t.relationship && <p className="text-xs text-silver-500 mt-0.5">{t.relationship}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
