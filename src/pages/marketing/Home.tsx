import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Stats, ListingsGrid, ProcessSteps, CtaBand } from '../../components/marketing/sections';

/** Landing page: a hero plus a brief taste of each section, linking to the full pages. */
export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight-900 via-midnight-900 to-brand-800" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-flame-300 mb-4">Realtor · Coldwell Banker Schmidt Realty</p>
            <h1 className="font-display text-4xl sm:text-6xl text-white leading-tight">Real estate built on empathy and ethics.</h1>
            <p className="mt-6 text-lg text-silver-200 max-w-xl leading-relaxed">
              I help families and seniors navigate one of life's biggest transitions with steady, honest
              guidance. Sixteen years in social work, now serving Northeast Ohio with Coldwell Banker Schmidt Realty.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-flame-600 hover:bg-flame-700 px-6 py-3 text-sm font-semibold text-white transition-colors">
                Schedule a conversation <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/listings" className="inline-flex items-center gap-2 rounded-full border border-silver-300/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                View current listings
              </Link>
            </div>
            <p className="mt-7 text-xs text-silver-400 tracking-wide">REALTOR® · Seniors Real Estate Specialist (SRES®) · Ohio License #2019003261</p>
          </div>
          <div className="justify-self-center lg:justify-self-end">
            <img src="/stephanie.png" alt="Stephanie Shaffer" className="w-56 sm:w-64 lg:w-full lg:max-w-sm aspect-[3/4] object-cover object-top rounded-2xl ring-1 ring-white/15 shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-white border-b border-silver-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12"><Stats /></div>
      </section>

      {/* About teaser */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">About</p>
            <h2 className="font-display text-3xl text-midnight-900">A social worker turned realtor.</h2>
            <p className="mt-4 text-silver-600 leading-relaxed">
              Sixteen years in social work taught me to listen first. I bring that same patience and care to
              real estate, with a focus on family transitions and senior downsizing across Mentor, Lake, and Geauga counties.
            </p>
            <Link to="/about" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-flame-600 hover:text-flame-700">
              More about Stephanie <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <img src="/stephanie.png" alt="Stephanie Shaffer" className="w-full max-w-xs mx-auto md:mx-0 md:justify-self-end aspect-[3/4] object-cover object-top rounded-2xl shadow-lg ring-1 ring-silver-200" />
        </div>
      </section>

      {/* Listings teaser */}
      <section className="bg-white border-y border-silver-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-2">Listings</p>
              <h2 className="font-display text-3xl text-midnight-900">Current listings</h2>
            </div>
            <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-flame-600 hover:text-flame-700">
              View all listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-8"><ListingsGrid limit={3} /></div>
        </div>
      </section>

      {/* Process teaser */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-2">Process</p>
            <h2 className="font-display text-3xl text-midnight-900">A calm, predictable process.</h2>
          </div>
          <Link to="/process" className="inline-flex items-center gap-1.5 text-sm font-semibold text-flame-600 hover:text-flame-700">
            See how I work <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="mt-8"><ProcessSteps compact /></div>
      </section>

      <CtaBand />
    </>
  );
}
