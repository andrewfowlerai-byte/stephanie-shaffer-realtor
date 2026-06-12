import { ValueCards, Stats, CtaBand } from '../../components/marketing/sections';

export default function About() {
  return (
    <>
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-6">About</p>

        <div className="grid gap-10 md:grid-cols-[280px_1fr] md:items-start">
          <div className="mx-auto md:mx-0 w-full max-w-[280px] md:sticky md:top-28">
            <img src="/stephanie.png" alt="Stephanie Shaffer, Realtor" className="w-full aspect-[3/4] object-cover object-top rounded-2xl shadow-lg ring-1 ring-silver-200" />
            <div className="mt-3 text-center md:text-left">
              <p className="font-display text-lg text-midnight-900">Stephanie Shaffer</p>
              <p className="text-xs uppercase tracking-[0.22em] text-flame-600 mt-1">Realtor · SRES®</p>
            </div>
          </div>

          <div>
            <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">Hi, I'm Stephanie.</h1>
            <div className="mt-6 space-y-5 text-lg text-silver-700 leading-relaxed">
              <p>
                I believe that in the middle of life's most significant transitions, everyone deserves a calm and
                ethical advocate. Real estate is rarely just about a property. It is about the people, the emotions,
                and the new beginnings that happen between the walls. Whether you are buying your first home, expanding
                your family, or closing a long-held chapter, my mission is to provide the stability and clarity you
                need to move forward.
              </p>
              <p>
                My approach is rooted in 16 years of service as a social worker with Children Services, where I guided
                families through their most vulnerable and complex moments. That experience instilled in me a commitment
                to ethics, calm problem-solving, and a deep sense of empathy. I have learned that in real estate, just
                as in social work, trust is the foundation of every successful outcome.
              </p>
              <p>
                I also know what it's like to be in your shoes because I've been there myself. I've owned multiple
                properties and I've made the major move of relocating across the state. I know the exact mix of
                excitement and stress that comes with packing up your life, and I use that personal experience to make
                sure your own move feels steady and organized from start to finish.
              </p>
              <p>
                While I am a dedicated advocate for clients at every stage of life, I also hold a Seniors Real Estate
                Specialist® (SRES®) designation. This allows me to bring specialized training, patience, and meticulous
                organization to older adults and their families navigating the unique layers of downsizing or relocating.
                I bring that same high-touch level of care and attention to detail to every client I serve, regardless
                of the chapter they are currently writing.
              </p>
              <p>
                Backed by the global reach of Coldwell Banker, I combine sophisticated marketing and pricing strategies
                with a support network that ensures no detail is overlooked. My goal is to make the experience not just
                successful, but supportive and meaningful. I am here to provide the protection you need to find comfort,
                clarity, and possibility in the place you call home.
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
