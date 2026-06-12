import { MessageCircle, Footprints, ClipboardCheck, KeyRound, Heart, ShieldCheck, Clock, MapPin, Check } from 'lucide-react';
import { CtaBand } from '../../components/marketing/sections';

const STEPS = [
  {
    Icon: MessageCircle,
    title: 'Conversation',
    lead: 'It starts with a conversation, not a contract.',
    body: 'We sit down in person, on the phone, or over coffee, whatever is easiest, and talk through what you are hoping for, what is prompting the move, and what is on your mind. After sixteen years in social work, I have learned that listening comes first. No pressure, no obligation, just an honest talk about whether the timing and the fit are right for you.',
    points: [
      'Your goals, timeline, and budget or price range',
      'The questions you have not had time to ask',
      'An honest take on whether now is the right time',
    ],
  },
  {
    Icon: Footprints,
    title: 'Walk-through',
    lead: 'Then we look at the homes together.',
    body: 'If you are selling, we walk your home room by room so you understand exactly how a buyer will see it, and what, if anything, is worth doing before we list. If you are buying, we tour homes that fit your life, not just your search filters. Either way, you will never feel rushed or pushed toward a number.',
    points: [
      'An honest read on condition and the features that stand out',
      'Simple, low-cost preparation that makes a real difference',
      'For buyers, what your budget really buys in each neighborhood',
    ],
  },
  {
    Icon: ClipboardCheck,
    title: 'Strategy',
    lead: 'Next, I put a clear plan in writing.',
    body: 'For sellers, that means a pricing strategy grounded in real local data, a preparation checklist, and a marketing timeline. For buyers, it is a search and offer plan that keeps you competitive without overpaying. You will always know what the plan is, why we are doing it, and what comes next.',
    points: [
      'Pricing or budget backed by current Northeast Ohio market data',
      'A week-by-week timeline that fits your life, not the other way around',
      'Clear next steps, so you are never left guessing',
    ],
  },
  {
    Icon: KeyRound,
    title: 'Closing',
    lead: 'When the paperwork starts, I carry the load.',
    body: 'Inspections, appraisals, lenders, title, and the dozens of small deadlines in between, I handle the moving parts and keep you informed at every turn. My promise is simple: no surprises. You will hear from me before you have to wonder, and the finish line will feel as calm as the first conversation.',
    points: [
      'Coordination with lenders, inspectors, and title from start to finish',
      'Plain-language updates so you always know where things stand',
      'Someone in your corner, negotiating on your behalf',
    ],
  },
];

const PROMISES = [
  { Icon: Heart, title: 'Empathy first', body: 'I meet you where you are. Whether this is your first home or your last move after decades in one, your pace sets ours.' },
  { Icon: ShieldCheck, title: 'Honesty, always', body: 'I will tell you what I would tell my own family, even when it is not what you hoped to hear. Ethics are not negotiable.' },
  { Icon: Clock, title: 'Patience, never pressure', body: 'This is one of the biggest decisions you will make. You will never be rushed into it by me.' },
  { Icon: MapPin, title: 'Rooted right here', body: 'I live and work in Northeast Ohio. I know these neighborhoods, and the people who make them home.' },
];

export default function Process() {
  return (
    <>
      {/* Intro */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Process</p>
        <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">A calm, predictable process.</h1>
        <p className="mt-5 text-lg text-silver-600 max-w-2xl leading-relaxed">
          Buying or selling a home is rarely just about the house. It is about a new job, a growing family, a parent
          who needs more care, or a chapter that is gently coming to a close. My job is to make the move feel
          manageable, and to make sure you feel looked after the whole way through. Here is how we do it together,
          one step at a time, with no surprises.
        </p>
      </section>

      {/* Detailed steps */}
      <section className="bg-white border-y border-silver-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 space-y-6">
          {STEPS.map(({ Icon, title, lead, body, points }, i) => (
            <div key={title} className="grid gap-6 md:grid-cols-[auto_1fr] rounded-2xl border border-silver-200 bg-silver-50/40 p-6 sm:p-8">
              <div className="flex md:flex-col items-center md:items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-midnight-900 text-flame-300 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-display text-3xl text-silver-300 leading-none">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div>
                <h2 className="font-display text-2xl text-midnight-900">{title}</h2>
                <p className="mt-1 text-flame-700 font-medium">{lead}</p>
                <p className="mt-3 text-silver-600 leading-relaxed max-w-2xl">{body}</p>
                <ul className="mt-4 space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-midnight-800">
                      <Check className="w-4 h-4 text-flame-600 mt-0.5 flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promises */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">What you can expect from me</p>
          <h2 className="font-display text-3xl text-midnight-900">The same care I would want for my own family.</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-silver-200 bg-white p-6 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-flame-50 text-flame-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-display text-lg text-midnight-900">{title}</h3>
              <p className="mt-2 text-sm text-silver-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Personal note */}
      <section className="bg-midnight-900">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 py-16 text-center">
          <p className="font-display text-2xl sm:text-3xl text-silver-100 leading-snug">
            &ldquo;I came to real estate to help people through a transition, not to push a transaction. Every family
            I work with gets the same patience and honesty I would want for my own.&rdquo;
          </p>
          <p className="mt-6 text-sm uppercase tracking-[0.22em] text-flame-300">Stephanie Shaffer</p>
          <p className="text-xs text-silver-400 mt-1">Realtor, Coldwell Banker Schmidt Realty</p>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
