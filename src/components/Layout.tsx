import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Send, CalendarDays, Building2, Settings as SettingsIcon, UserPlus, LogOut, Menu, X } from 'lucide-react';
import { signOut } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  onAddContact?: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/contacts', label: 'Contacts', icon: Users, end: false },
  { to: '/follow-ups', label: 'Follow-ups', icon: Send, end: false },
  { to: '/manage-listings', label: 'Listings', icon: Building2, end: false },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export default function Layout({ children, onAddContact }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error(err);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-flame-500/15 text-flame-400 border-l-2 border-flame-500 pl-[10px]'
        : 'text-silver-300 hover:bg-midnight-700/40 hover:text-silver-100 border-l-2 border-transparent pl-[10px]'
    }`;

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-midnight-700/50">
        <p className="font-display text-silver-100 text-base tracking-wide">Stephanie Shaffer</p>
        <p className="text-[9px] uppercase tracking-[0.22em] text-flame-400 mt-1">
          Realtor CRM <span className="text-silver-400">·</span> Coldwell Banker
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        <button
          onClick={() => { onAddContact?.(); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-silver-300 hover:bg-midnight-700/40 hover:text-silver-100 transition-colors border-l-2 border-transparent pl-[10px] mt-2"
        >
          <UserPlus className="w-4 h-4 flex-shrink-0" />
          Add Contact
        </button>
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t border-midnight-700/50 pt-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-silver-400 hover:bg-flame-500/10 hover:text-flame-400 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-silver-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 flex-shrink-0 bg-midnight-950 border-r border-midnight-700/40">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-midnight-950 border-b border-midnight-700/40 px-4 h-14 flex items-center justify-between">
        <span className="font-display text-silver-100 text-sm">Stephanie Shaffer</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-midnight-700/40 text-silver-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-30 h-full w-64 bg-midnight-950 border-r border-midnight-700/40 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden lg:pt-0 pt-14">
        <div className="max-w-7xl mx-auto p-6 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
