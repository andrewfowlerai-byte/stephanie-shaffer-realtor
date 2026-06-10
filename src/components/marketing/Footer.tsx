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
          <p className="text-xs uppercase tracking-[0.24em] text-flame-400 mt-1.5">Realtor · Coldwell Banker Schmidt Realty</p>
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
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-silver-400">
          <p>&copy; {year} Stephanie Shaffer. Ohio License #2019003261.</p>
          <p>Each office is independently owned and operated.</p>
        </div>
      </div>
    </footer>
  );
}
