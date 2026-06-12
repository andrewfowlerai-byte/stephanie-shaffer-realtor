import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Clock, HeartHandshake, MapPin, MessageCircle, Footprints, ClipboardCheck, KeyRound,
  BedDouble, Bath, Maximize, ArrowRight, CheckCircle2, Send,
} from 'lucide-react';
import { submitLead } from '../../lib/leads';
import { fetchListings, formatPrice, type Listing } from '../../lib/listings';

// ─── Stats / credentials ────────────────────────────────────────────────-

export function Stats() {
  const stats = [
    { Icon: Clock, value: '16 years', label: 'in social work before real estate' },
    { Icon: ShieldCheck, value: 'SRES®', label: 'Seniors Real Estate Specialist' },
    { Icon: HeartHandshake, value: 'Schmidt', label: 'backed by the Schmidt Family of Companies' },
    { Icon: MapPin, value: '4 counties', label: 'Lake, Geauga, Ashtabula, and Trumbull, across Northeast Ohio' },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
  );
}

// ─── Listings ─────────────────────────────────────────────────────────────

function ListingCard({ listing: l }: { listing: Listing }) {
  const statusColor = l.status === 'Active' ? 'bg-emerald-600' : l.status === 'Pending' ? 'bg-flame-600' : 'bg-silver-500';
  const photo = l.photos?.[0];
  return (
    <a href="/contact" className="group rounded-2xl border border-silver-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-midnight-800 to-brand-700">
        {photo && <img src={photo} alt={l.address} className="absolute inset-0 w-full h-full object-cover" />}
        <span className={`absolute top-3 left-3 text-[11px] font-semibold uppercase tracking-wide text-white px-2 py-0.5 rounded-full ${statusColor}`}>{l.status}</span>
        <span className="absolute bottom-3 left-3 text-white font-display text-xl drop-shadow">{formatPrice(l.price)}</span>
      </div>
      <div className="p-5">
        <p className="font-display text-lg text-midnight-900">{l.address}</p>
        {l.city && <p className="text-sm text-silver-500">{l.city}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-silver-600">
          {l.beds != null && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-flame-600" /> {l.beds} bd</span>}
          {l.baths != null && <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-flame-600" /> {l.baths} ba</span>}
          {l.sqft != null && <span className="flex items-center gap-1"><Maximize className="w-4 h-4 text-flame-600" /> {l.sqft.toLocaleString()} sqft</span>}
        </div>
        {l.description && <p className="text-sm text-silver-500 mt-3 leading-relaxed line-clamp-2">{l.description}</p>}
        {l.mls && <p className="font-mono text-[10px] text-silver-400 mt-3 uppercase tracking-wider">MLS {l.mls}</p>}
      </div>
    </a>
  );
}

export function ListingsGrid({ limit }: { limit?: number }) {
  const [listings, setListings] = useState<Listing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchListings(limit ? { limit } : undefined)
      .then((l) => { if (!cancelled) setListings(l); })
      .catch(() => { if (!cancelled) setListings([]); });
    return () => { cancelled = true; };
  }, [limit]);

  if (listings === null) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit ?? 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-silver-200 bg-white overflow-hidden shadow-sm">
            <div className="aspect-[4/3] bg-silver-200 animate-pulse" />
            <div className="p-5 space-y-2">
              <div className="h-4 bg-silver-200 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-silver-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-silver-300 bg-white p-10 text-center">
        <p className="font-display text-lg text-midnight-900">Listings are on the way.</p>
        <p className="text-sm text-silver-500 mt-1">Reach out and I will send you what fits, often before it hits the market.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (<ListingCard key={l.id} listing={l} />))}
    </div>
  );
}

// ─── Values ─────────────────────────────────────────────────────────────-

export function ValueCards() {
  const values = [
    { Icon: ShieldCheck, title: 'Ethics', body: 'Honest advice, even when it is not the easy answer. Your interests come first, every time.' },
    { Icon: Clock, title: 'Patience', body: 'No rushing, no pressure. We move at the pace that feels right for you and your family.' },
    { Icon: HeartHandshake, title: 'Empathy', body: 'A move is rarely just a transaction. I listen first, and I am with you through the whole change.' },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {values.map(({ Icon, title, body }) => (
        <div key={title} className="rounded-2xl border border-silver-200 bg-silver-50 p-6">
          <div className="w-11 h-11 rounded-xl bg-flame-100 text-flame-700 flex items-center justify-center"><Icon className="w-5 h-5" /></div>
          <h3 className="mt-4 font-display text-xl text-midnight-900">{title}</h3>
          <p className="mt-2 text-sm text-silver-600 leading-relaxed">{body}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Process ──────────────────────────────────────────────────────────────

export function ProcessSteps({ compact = false }: { compact?: boolean }) {
  const steps = [
    { Icon: MessageCircle, title: 'Conversation', body: 'We start with a relaxed talk about your goals, your timeline, and any worries. No pressure, no obligation.' },
    { Icon: Footprints, title: 'Walk-through', body: 'We look at your home, or the homes you are considering, together, so you know exactly where you stand.' },
    { Icon: ClipboardCheck, title: 'Strategy', body: 'A clear, written plan: pricing or budget, preparation, and timing that fits your life.' },
    { Icon: KeyRound, title: 'Closing', body: 'I handle the details and keep you informed, so the finish line feels calm and predictable.' },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map(({ Icon, title, body }, i) => (
        <div key={title} className="rounded-2xl border border-silver-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-midnight-900 text-flame-300 flex items-center justify-center"><Icon className="w-5 h-5" /></div>
            <span className="font-display text-2xl text-silver-300">{i + 1}</span>
          </div>
          <h3 className="mt-4 font-display text-lg text-midnight-900">{title}</h3>
          {!compact && <p className="mt-2 text-sm text-silver-600 leading-relaxed">{body}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Contact form ─────────────────────────────────────────────────────────

const INTERESTS = ['Selling my home', 'Buying a home', 'Senior downsizing', 'Market information', 'Other'];

export function ContactForm() {
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

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-silver-200 bg-silver-50 p-7 shadow-sm flex flex-col items-center text-center py-12">
        <CheckCircle2 className="w-12 h-12 text-flame-600" />
        <h3 className="mt-4 font-display text-2xl text-midnight-900">Thank you.</h3>
        <p className="mt-2 text-sm text-silver-600">Your note is on its way. I will be in touch soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-silver-200 bg-silver-50 p-7 shadow-sm space-y-4">
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
  );
}

// ─── Reusable closing CTA band ────────────────────────────────────────────

export function CtaBand() {
  return (
    <section className="bg-white border-t border-silver-200">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16 text-center">
        <h2 className="font-display text-3xl text-midnight-900">Thinking about a move?</h2>
        <p className="mt-3 text-silver-600">No pressure, ever. Just a friendly conversation to start.</p>
        <Link to="/contact" className="mt-7 inline-flex items-center gap-2 rounded-full bg-flame-600 hover:bg-flame-700 px-6 py-3 text-sm font-semibold text-white transition-colors">
          Start a conversation <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
