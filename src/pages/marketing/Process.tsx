import { ProcessSteps, CtaBand } from '../../components/marketing/sections';

export default function Process() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Process</p>
        <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">A calm, predictable process.</h1>
        <p className="mt-5 text-lg text-silver-600 max-w-2xl leading-relaxed">
          Buying or selling can feel overwhelming. My job is to make it feel manageable. Here is how we work
          together, one step at a time, with no surprises along the way.
        </p>
        <div className="mt-10"><ProcessSteps /></div>
      </div>
      <CtaBand />
    </>
  );
}
