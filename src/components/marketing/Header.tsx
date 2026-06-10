import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';

const NAV = [
  { to: '/listings', label: 'Listings' },
  { to: '/about', label: 'About' },
  { to: '/process', label: 'Process' },
  { to: '/contact', label: 'Contact' },
];

const navLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium tracking-wide transition-colors ${isActive ? 'text-flame-600' : 'text-midnight-800 hover:text-flame-600'}`;

/** Public marketing header. Multi-page nav, Coldwell Banker Schmidt aligned. */
export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30">
      {/* Top contact bar */}
      <div className="bg-midnight-900 text-silver-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-1.5 flex items-center justify-between text-xs">
          <a href="tel:+19377285722" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone className="w-3 h-3 text-flame-400" /> (937) 728-5722
          </a>
          <span className="hidden sm:inline text-silver-400">Coldwell Banker Schmidt Realty</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="border-b border-silver-200 bg-silver-50/90 backdrop-blur supports-[backdrop-filter]:bg-silver-50/75">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Stephanie Shaffer, Realtor. Home" className="flex flex-col leading-none shrink-0">
            <span className="font-display text-lg sm:text-xl text-midnight-900 tracking-tight">Stephanie Shaffer</span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-flame-600 mt-1">
              Realtor <span className="text-silver-400">·</span> Coldwell Banker Schmidt Realty
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (<NavLink key={n.to} to={n.to} className={navLink}>{n.label}</NavLink>))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:inline-block text-xs font-medium text-silver-500 hover:text-midnight-800 transition-colors">Agent Login</Link>
            <Link to="/contact" className="hidden sm:inline-flex items-center rounded-full bg-flame-600 hover:bg-flame-700 px-4 py-2 text-sm font-semibold text-white transition-colors">Schedule a conversation</Link>
            <button onClick={() => setOpen((v) => !v)} className="md:hidden p-2 rounded-lg text-midnight-800 hover:bg-silver-200 transition-colors" aria-label="Toggle menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-silver-200 bg-silver-50 px-5 py-4 space-y-3">
            {NAV.map((n) => (<NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className="block text-base font-medium text-midnight-800">{n.label}</NavLink>))}
            <Link to="/login" onClick={() => setOpen(false)} className="block text-sm text-silver-500 pt-2 border-t border-silver-200">Agent Login</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
