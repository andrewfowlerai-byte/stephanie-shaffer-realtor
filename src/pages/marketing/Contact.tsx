import { Phone, Mail, MapPin } from 'lucide-react';
import { ContactForm } from '../../components/marketing/sections';
import SocialLinks from '../../components/marketing/SocialLinks';

export default function Contact() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 sm:py-20 grid gap-12 lg:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-flame-600 mb-3">Contact</p>
        <h1 className="font-display text-4xl sm:text-5xl text-midnight-900 leading-tight">Let's start a conversation.</h1>
        <p className="mt-5 text-lg text-silver-600 leading-relaxed">
          Tell me a little about what you are facing. I read every note myself, and there is never any pressure.
        </p>
        <div className="mt-8 space-y-3 text-sm">
          <a href="tel:+19377285722" className="flex items-center gap-3 text-midnight-800 hover:text-flame-600 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center"><Phone className="w-4 h-4" /></span>
            (937) 728-5722 mobile
          </a>
          <a href="tel:+14409511410" className="flex items-center gap-3 text-midnight-800 hover:text-flame-600 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-flame-100 text-flame-700 flex items-center justify-center"><Phone className="w-4 h-4" /></span>
            (440) 951-1410 office
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
        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-silver-400 mb-3">Find me online</p>
          <SocialLinks tone="light" />
        </div>
      </div>
      <div><ContactForm /></div>
    </div>
  );
}
