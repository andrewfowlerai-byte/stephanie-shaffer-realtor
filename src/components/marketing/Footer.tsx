import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import SocialLinks from './SocialLinks';

/** Public marketing footer. Real contact details + the standard Coldwell Banker
 *  independent-ownership and license line. */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-silver-200 bg-midnight-900 text-silver-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-xl text-white">Stephanie Shaffer</p>
          <p className="font-display text-xl text-silver-100 mt-1">Coldwell Banker Schmidt Realty</p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-flame-400 mt-2">Realtor · Seniors Real Estate Specialist (SRES®)</p>
          <p className="text-sm text-silver-300 mt-4 max-w-sm leading-relaxed">
            Real estate built on empathy and ethics. Helping families and seniors across Northeast Ohio
            move forward with a calm, predictable process.
          </p>
          <SocialLinks tone="dark" className="mt-5" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-silver-400 mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/listings" className="hover:text-white transition-colors">Listings</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link to="/process" className="hover:text-white transition-colors">Process</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-silver-400 mb-3">Get in touch</p>
          <ul className="space-y-2 text-sm">
            <li><a href="tel:+19377285722" className="flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-4 h-4 text-flame-400" /> (937) 728-5722 mobile</a></li>
            <li><a href="tel:+14409511410" className="flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-4 h-4 text-flame-400" /> (440) 951-1410 office</a></li>
            <li><a href="mailto:stephanie.shaffer@cbschmidtohio.com" className="flex items-center gap-2 hover:text-white transition-colors"><Mail className="w-4 h-4 text-flame-400" /> stephanie.shaffer@cbschmidtohio.com</a></li>
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-flame-400 mt-0.5" /> 7410 Center Street, Mentor, OH 44060</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-midnight-700/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-silver-400">
          <p className="text-center sm:text-left leading-relaxed max-w-2xl">
            &copy; {year} Stephanie Shaffer, Realtor with Coldwell Banker Schmidt Realty. Ohio License #2019003261.
            Each office is independently owned and operated.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0" title="Equal Housing Opportunity">
            <EqualHousingLogo className="w-6 h-6 text-silver-300" />
            <span className="uppercase tracking-[0.12em] text-[10px] text-silver-400 leading-tight">Equal Housing<br />Opportunity</span>
          </div>
        </div>
      </div>

      <div className="border-t border-midnight-700/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3 text-center">
          <a href="https://anfconsult.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-silver-500 hover:text-silver-300 transition-colors">
            Powered by ANF Consulting
          </a>
        </div>
      </div>
    </footer>
  );
}

/** Equal Housing Opportunity mark (a house with an equals sign), the standard
 *  Fair Housing symbol shown in real estate advertising. */
function EqualHousingLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" aria-label="Equal Housing Opportunity">
      <path d="M2.5 11.5 L12 3.5 L21.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.2 V20.5 H19 V10.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13.6 H15 M9 16.6 H15" strokeLinecap="round" />
    </svg>
  );
}
