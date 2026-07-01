import { ListingsGrid, CtaBand } from '../../components/marketing/sections';

export default function Listings() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Listings</p>
        <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">Current listings</h1>
        <p className="mt-5 text-lg text-silver-600 max-w-2xl leading-relaxed">
          Homes I am representing across Northeast Ohio with Coldwell Banker Schmidt Realty. See something you like,
          or want me to keep an eye out for something specific? Reach out anytime.
        </p>
        <div className="mt-10"><ListingsGrid /></div>
      </div>
      <CtaBand />
    </>
  );
}
