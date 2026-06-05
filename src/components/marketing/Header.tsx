import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/listings', label: 'Listings', end: false },
  { to: '/areas-served', label: 'Areas Served', end: false },
  { to: '/about', label: 'About', end: false },
  { to: '/contact', label: 'Contact', end: false },
];

const navLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium tracking-wide transition-colors ${
    isActive ? 'text-flame-600' : 'text-midnight-800 hover:text-flame-600'
  }`;

/** Public marketing header. Warm, Coldwell Banker aligned. */
export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-silver-200 bg-silver-50/85 backdrop-blur supports-[backdrop-filter]:bg-silver-50/70">
      <nav className="max-w-6xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" aria-label="Stephanie Shaffer, Realtor. Home" className="flex flex-col leading-none shrink-0">
          <span className="font-display text-lg sm:text-xl text-midnight-900 tracking-tight">Stephanie Shaffer</span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-flame-600 mt-1">
            Realtor <span className="text-silver-400">·</span> Coldwell Banker
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navLink}>
              {n.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden md:inline-block text-xs font-medium text-silver-500 hover:text-midnight-800 transition-colors"
          >
            Agent Login
          </Link>
          <Link
            to="/contact"
            className="hidden sm:inline-flex items-center rounded-full bg-flame-600 hover:bg-flame-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Let's talk
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-midnight-800 hover:bg-silver-200 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-silver-200 bg-silver-50 px-5 py-4 space-y-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-midnight-800"
            >
              {n.label}
            </NavLink>
          ))}
          <Link to="/login" onClick={() => setOpen(false)} className="block text-sm text-silver-500 pt-2 border-t border-silver-200">
            Agent Login
          </Link>
        </div>
      )}
    </header>
  );
}
