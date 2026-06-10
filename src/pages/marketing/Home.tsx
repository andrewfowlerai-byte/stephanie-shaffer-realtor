import { useState, type FormEvent } from 'react';
import {
  ArrowRight, Phone, Mail, MapPin, ShieldCheck, Clock, HeartHandshake,
  MessageCircle, Footprints, ClipboardCheck, KeyRound, BedDouble, Bath, Maximize, CheckCircle2, Send,
} from 'lucide-react';
import { submitLead } from '../../lib/leads';
import { getListings, formatPrice, type Listing } from '../../lib/listings';

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Listings />
      <About />
      <Process />
      <Contact />
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-midnight-900 via-midnight-900 to-brand-800" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-6 py-20 sm:py-24 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-flame-300 mb-4">Realtor · Coldwell Banker Schmidt Realty</p>
          <h1 className="font-display text-4xl sm:text-6xl text-white leading-tight">
            Real estate built on empathy and ethics.
          </h1>
          <p className="mt-6 text-lg text-silver-200 max-w-xl leading-relaxed">
            I help families and seniors navigate one of life's biggest transitions with steady, honest
            guidance. Sixteen years in social work, now serving Northeast Ohio with Coldwell Banker Schmidt Realty.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full bg-flame-600 hover:bg-flame-700 px-6 py-3 text-sm font-semibold text-white transition-colors">
              Schedule a conversation <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#listings" className="inline-flex items-center gap-2 rounded-full border border-silver-300/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              View current listings
            </a>
          </div>
          <p className="mt-7 text-xs text-silver-400 tracking-wide">
            REALTOR® · Seniors Real Estate Specialist (SRES®) · Ohio License #2019003261
          </p>
        </div>
        <div className="justify-self-center lg:justify-self-end">
          <img
            src="/stephanie.png"
            alt="Stephanie Shaffer"
            className="w-56 sm:w-64 lg:w-full lg:max-w-sm aspect-[3/4] object-cover object-top rounded-2xl ring-1 ring-white/15 shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Stats / credentials ────────────────────────────────────────────────-

function Stats() {
  const stats = [
    { Icon: Clock, value: '16 years', label: 'in social work before real estate' },
    { Icon: ShieldCheck, value: 'SRES®', label: 'Seniors Real Estate Specialist' },
    { Icon: HeartHandshake, value: 'Schmidt', label: 'backed by the Schmidt Family of Companies' },
    { Icon: MapPin, value: 'Mentor · Lake · Geauga', label: 'counties served across Northeast Ohio' },
  ];
  return (
    <section className="bg-white border-b border-silver-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ Icon, value, label }) => (
          <div key={value} className="flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-flame-100 text-flame-700 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <p className="mt-3 font-display text-xl text-midnight-900">{value}</p>
            <p className="text-sm text-silver-600 mt-1 leading-snug">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Listings ─────────────────────────────────────────────────────────────

function Listings() {
  const listings = getListings();
  return (
    <section id="listings" className="scroll-mt-24 max-w-6xl mx-auto px-5 sm:px-6 py-20">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-2">Listings</p>
          <h2 className="font-display text-3xl sm:text-4xl text-midnight-900">Current listings</h2>
          <p className="text-sm text-silver-500 mt-2">Updated from MLS Now, the Northeast Ohio MLS.</p>
        </div>
        <a href="#contact" className="text-sm font-semibold text-flame-600 hover:text-flame-700">Ask about a home</a>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (<ListingCard key={l.id} listing={l} />))}
      </div>
    </section>
  );
}

function ListingCard({ listing: l }: { listing: Listing }) {
  const statusColor = l.status === 'Active' ? 'bg-emerald-600' : l.status === 'Pending' ? 'bg-flame-600' : 'bg-silver-500';
  return (
    <a href={l.url ?? '#contact'} className="group rounded-2xl border border-silver-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-midnight-800 to-brand-700">
        {l.imageUrl && <img src={l.imageUrl} alt={l.address} className="absolute inset-0 w-full h-full object-cover" />}
        <span className={`absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wide text-white px-2 py-0.5 rounded-full ${statusColor}`}>{l.status}</span>
        <span className="absolute bottom-3 left-3 text-white font-display text-xl drop-shadow">{formatPrice(l.price)}</span>
      </div>
      <div className="p-5">
        <p className="font-display text-lg text-midnight-900">{l.address}</p>
        <p className="text-sm text-silver-500">{l.city}</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-silver-600">
          <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-flame-600" /> {l.beds} bd</span>
          <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-flame-600" /> {l.baths} ba</span>
          {l.sqft && <span className="flex items-center gap-1"><Maximize className="w-4 h-4 text-flame-600" /> {l.sqft.toLocaleString()} sqft</span>}
        </div>
        {l.description && <p className="text-sm text-silver-500 mt-3 leading-relaxed line-clamp-2">{l.description}</p>}
        {l.mls && <p className="font-mono text-[10px] text-silver-400 mt-3 uppercase tracking-wider">{l.mls}</p>}
      </div>
    </a>
  );
}

// ─── About + values ───────────────────────────────────────────────────────

function About() {
  const values = [
    { Icon: ShieldCheck, title: 'Ethics', body: 'Honest advice, even when it is not the easy answer. Your interests come first, every time.' },
    { Icon: Clock, title: 'Patience', body: 'No rushing, no pressure. We move at the pace that feels right for you and your family.' },
    { Icon: HeartHandshake, title: 'Empathy', body: 'A move is rarely just a transaction. I listen first, and I am with you through the whole change.' },
  ];
  return (
    <section id="about" className="scroll-mt-24 bg-white border-y border-silver-200">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-20">
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">About</p>
        <h2 className="font-display text-3xl sm:text-4xl text-midnight-900 leading-tight">Hi, I'm Stephanie.</h2>
        <div className="mt-6 space-y-5 text-lg text-silver-700 leading-relaxed max-w-3xl">
          <p>
            I spent sixteen years in social work before real estate, and that is still how I work: I listen,
            I take the time to understand what you need, and I guide you through with care.
          </p>
          <p>
            I specialize in family transitions and senior downsizing, the kinds of moves that carry a lot of
            feeling along with the paperwork. As a Seniors Real Estate Specialist with Coldwell Banker Schmidt
            Realty, I bring a steady, honest hand to every step across Mentor, Lake, and Geauga counties.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {values.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-silver-200 bg-silver-50 p-6">
              <div className="w-11 h-11 rounded-xl bg-flame-100 text-flame-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-display text-xl text-midnight-900">{title}</h3>
              <p className="mt-2 text-sm text-silver-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Process ──────────────────────────────────────────────────────────────

function Process() {
  const steps = [
    { Icon: MessageCircle, title: 'Conversation', body: 'We start with a relaxed talk about your goals, your timeline, and any worries. No pressure, no obligation.' },
    { Icon: Footprints, title: 'Walk-through', body: 'We look at your home or the homes you are considering together, so you know exactly where you stand.' },
    { Icon: ClipboardCheck, title: 'Strategy', body: 'A clear, written plan: pricing or budget, preparation, and timing that fits your life.' },
    { Icon: KeyRound, title: 'Closing', body: 'I handle the details and keep you informed, so the finish line feels calm and predictable.' },
  ];
  return (
    <section id="process" className="scroll-mt-24 max-w-6xl mx-auto px-5 sm:px-6 py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Process</p>
      <h2 className="font-display text-3xl sm:text-4xl text-midnight-900">A calm, predictable process.</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ Icon, title, body }, i) => (
          <div key={title} className="rounded-2xl border border-silver-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-midnight-900 text-flame-300 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-display text-2xl text-silver-300">{i + 1}</span>
            </div>
            <h3 className="mt-4 font-display text-lg text-midnight-900">{title}</h3>
            <p className="mt-2 text-sm text-silver-600 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────

const INTERESTS = ['Selling my home', 'Buying a home', 'Senior downsizing', 'Market information', 'Other'];

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('sending');
    setError('');
    try {
      const noteParts = [interest && `Interested in: ${interest}`, message.trim()].filter(Boolean);
      await submitLead({
        contact_name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: noteParts.join('. ') || undefined,
      });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  const inputClass = 'w-full px-3.5 py-2.5 rounded-lg border border-silver-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent';

  return (
    <section id="contact" className="scroll-mt-24 bg-white border-t border-silver-200">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 py-20 grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Contact</p>
          <h2 className="font-display text-3xl sm:text-4xl text-midnight-900 leading-tight">Let's start a conversation.</h2>
          <p className="mt-5 text-lg text-silver-600 leading-relaxed">
            Tell me a little about what you are facing. I read every note myself, and there is never any pressure.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <a href="tel:+19377285722" className="flex items-center gap-3 text-midnight-800 hover:text-flame-600 transition-colors">
              <span className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center"><Phone className="w-4 h-4" /></span>
              (937) 728-5722 mobile
            </a>
            <a href="mailto:stephanie.shaffer@cbschmidtohio.com" className="flex items-center gap-3 text-midnight-800 hover:text-flame-600 transition-colors">
              <span className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center"><Mail className="w-4 h-4" /></span>
              stephanie.shaffer@cbschmidtohio.com
            </a>
            <div className="flex items-center gap-3 text-midnight-800">
              <span className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center"><MapPin className="w-4 h-4" /></span>
              7410 Center Street, Mentor, OH 44060
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-silver-200 bg-silver-50 p-7 shadow-sm">
          {status === 'sent' ? (
            <div className="flex flex-col items-center text-center py-10">
              <CheckCircle2 className="w-12 h-12 text-flame-600" />
              <h3 className="mt-4 font-display text-2xl text-midnight-900">Thank you.</h3>
              <p className="mt-2 text-sm text-silver-600">Your note is on its way. I will be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Your name" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-midnight-800 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-midnight-800 mb-1.5">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(000) 000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">How can I help?</label>
                <select value={interest} onChange={(e) => setInterest(e.target.value)} className={`${inputClass} bg-white`}>
                  <option value="">Select one</option>
                  {INTERESTS.map((o) => (<option key={o} value={o}>{o}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">Anything else?</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder="A sentence or two is plenty." />
              </div>
              {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={status === 'sending' || !name.trim()} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-flame-600 hover:bg-flame-700 disabled:opacity-60 px-6 py-3 text-sm font-semibold text-white transition-colors">
                {status === 'sending' ? 'Sending…' : <>Send message <Send className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
