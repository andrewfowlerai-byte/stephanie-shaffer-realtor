import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

/** Public marketing footer. Includes the standard Coldwell Banker
 *  independent-ownership line for franchise compliance. */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-silver-200 bg-midnight-900 text-silver-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-xl text-white">Stephanie Shaffer</p>
          <p className="text-xs uppercase tracking-[0.28em] text-flame-400 mt-1.5">Realtor · Coldwell Banker</p>
          <p className="text-sm text-silver-300 mt-4 max-w-sm leading-relaxed">
            A warm, steady guide through every move. Helping buyers and sellers feel at home,
            from the first conversation to the closing table.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-silver-400 mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/listings" className="hover:text-white transition-colors">Listings</Link></li>
            <li><Link to="/areas-served" className="hover:text-white transition-colors">Areas Served</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-silver-400 mb-3">Get in touch</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="mailto:hello@example.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-flame-400" /> hello@example.com
              </a>
            </li>
            <li>
              <a href="tel:+10000000000" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-flame-400" /> (000) 000-0000
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-midnight-700/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-silver-400">
          <p>&copy; {year} Stephanie Shaffer. All rights reserved.</p>
          <p>Each office is independently owned and operated.</p>
        </div>
      </div>
    </footer>
  );
}
