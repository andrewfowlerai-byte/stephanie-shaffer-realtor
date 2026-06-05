import { useState, type FormEvent } from 'react';
import { Mail, Phone, Send, CheckCircle2 } from 'lucide-react';
import { submitLead } from '../../lib/leads';

/**
 * Public Contact page. The form lands straight in the CRM as a new lead via
 * submitLead(). Works end to end once the Supabase project + anon-insert
 * policy are live (Sprint 0 provisioning).
 */
export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('sending');
    setError('');
    try {
      await submitLead({
        contact_name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: message.trim() || undefined,
      });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-20 grid gap-12 lg:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Contact</p>
        <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">
          Let's start a conversation.
        </h1>
        <p className="mt-5 text-lg text-silver-600 leading-relaxed">
          Tell me a little about what you are looking for. No pressure, no obligation. I read every
          note myself and will get back to you soon.
        </p>

        <div className="mt-8 space-y-3 text-sm">
          <a href="mailto:hello@example.com" className="flex items-center gap-3 text-midnight-800 hover:text-flame-600 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center"><Mail className="w-4 h-4" /></span>
            hello@example.com
          </a>
          <a href="tel:+10000000000" className="flex items-center gap-3 text-midnight-800 hover:text-flame-600 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center"><Phone className="w-4 h-4" /></span>
            (000) 000-0000
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-silver-200 bg-white p-7 shadow-sm">
        {status === 'sent' ? (
          <div className="flex flex-col items-center text-center py-10">
            <CheckCircle2 className="w-12 h-12 text-flame-600" />
            <h2 className="mt-4 font-display text-2xl text-midnight-900">Thank you.</h2>
            <p className="mt-2 text-sm text-silver-600">Your message is on its way. I will be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-midnight-800 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-silver-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-silver-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-silver-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
                  placeholder="(000) 000-0000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-midnight-800 mb-1.5">How can I help?</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-lg border border-silver-300 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent resize-none"
                placeholder="Buying, selling, or just exploring? A sentence or two is plenty."
              />
            </div>

            {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={status === 'sending' || !name.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-flame-600 hover:bg-flame-700 disabled:opacity-60 px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              {status === 'sending' ? 'Sending…' : <>Send message <Send className="w-4 h-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
