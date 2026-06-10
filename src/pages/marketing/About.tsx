import { ValueCards, Stats, CtaBand } from '../../components/marketing/sections';

export default function About() {
  return (
    <>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-6">About</p>

        <div className="grid gap-10 md:grid-cols-[280px_1fr] md:items-start">
          <div className="mx-auto md:mx-0 w-full max-w-[280px]">
            <img src="/stephanie.png" alt="Stephanie Shaffer, Realtor" className="w-full aspect-[3/4] object-cover object-top rounded-2xl shadow-lg ring-1 ring-silver-200" />
            <div className="mt-3 text-center md:text-left">
              <p className="font-display text-lg text-midnight-900">Stephanie Shaffer</p>
              <p className="text-xs uppercase tracking-[0.22em] text-flame-600 mt-1">Realtor · Coldwell Banker Schmidt Realty</p>
            </div>
          </div>

          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">Hi, I'm Stephanie.</h1>
            <div className="mt-6 space-y-5 text-lg text-silver-700 leading-relaxed">
              <p>
                I spent sixteen years in social work before real estate, and that is still how I work: I listen,
                I take the time to understand what you need, and I guide you through with care.
              </p>
              <p>
                I specialize in family transitions and senior downsizing, the kinds of moves that carry a lot of
                feeling along with the paperwork. As a Seniors Real Estate Specialist (SRES®) with Coldwell Banker
                Schmidt Realty, I bring a steady, honest hand to every step across Mentor, Lake, and Geauga counties.
              </p>
              <p>
                Whether you are buying your first home, selling one full of memories, or helping a parent downsize,
                I am here to make it feel calm and clear.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl text-midnight-900 mb-6">What you can count on</h2>
          <ValueCards />
        </div>

        <div className="mt-14 pt-10 border-t border-silver-200">
          <Stats />
        </div>
      </div>
      <CtaBand />
    </>
  );
}
