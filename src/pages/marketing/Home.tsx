import { Link } from 'react-router-dom';
import { Home as HomeIcon, Key, HeartHandshake, ArrowRight } from 'lucide-react';

/**
 * Public home page. Sprint 1 placeholder: structure and brand are in place,
 * real copy, photography, and the featured-listings carousel land in Sprint 2.
 */
export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight-900 via-midnight-800 to-brand-800" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-24 sm:py-32">
          <p className="text-xs uppercase tracking-[0.3em] text-flame-300 mb-4">Realtor · Coldwell Banker</p>
          <h1 className="font-display text-4xl sm:text-6xl text-white leading-tight max-w-3xl">
            A warm, steady hand through every move.
          </h1>
          <p className="mt-6 text-lg text-silver-200 max-w-xl leading-relaxed">
            Buying or selling is personal. I am here to make it feel that way, with honest guidance,
            local know-how, and care from the first hello to the closing table.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/listings"
              className="inline-flex items-center gap-2 rounded-full bg-flame-600 hover:bg-flame-700 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              View listings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-silver-300/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Start a conversation
            </Link>
          </div>
        </div>
      </section>

      {/* What she does */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-20">
        <h2 className="font-display text-3xl text-midnight-900 text-center">How I help</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Key, title: 'For buyers', body: 'Finding the right home at the right time, with a guide who listens first and negotiates hard.' },
            { icon: HomeIcon, title: 'For sellers', body: 'Pricing, preparing, and marketing your home so it shines, and sells, on your terms.' },
            { icon: HeartHandshake, title: 'For neighbors', body: 'Rooted locally and always glad to help, whether you are moving now or just have a question.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-silver-200 bg-white p-7 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-flame-100 text-flame-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-5 font-display text-xl text-midnight-900">{title}</h3>
              <p className="mt-2 text-sm text-silver-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured listings placeholder */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pb-20">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-midnight-900">Featured listings</h2>
          <Link to="/listings" className="text-sm font-semibold text-flame-600 hover:text-flame-700">View all</Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-silver-200 bg-white overflow-hidden shadow-sm">
              <div className="aspect-[4/3] bg-gradient-to-br from-silver-200 to-silver-300" />
              <div className="p-5">
                <p className="font-display text-lg text-midnight-900">Listing coming soon</p>
                <p className="text-sm text-silver-500 mt-1">Photos and details are on the way.</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-white border-y border-silver-200">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 text-center">
          <h2 className="font-display text-3xl text-midnight-900">Thinking about a move?</h2>
          <p className="mt-3 text-silver-600">No pressure, ever. Just a friendly conversation to start.</p>
          <Link
            to="/contact"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-flame-600 hover:bg-flame-700 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Get in touch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
