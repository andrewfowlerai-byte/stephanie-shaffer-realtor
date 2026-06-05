import { LogOut } from 'lucide-react';
import { signOut } from '../lib/supabase';
import NotificationsToggle from '../components/NotificationsToggle';

/**
 * Settings. Sprint 1: push notifications + sign out. Grows over later sprints
 * (Twilio number, Google sync, brand details).
 */
export default function Settings() {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl text-midnight-900">Settings</h1>
        <p className="text-sm text-silver-600 mt-0.5">Your account and notifications.</p>
      </div>

      <NotificationsToggle />

      <div className="bg-white rounded-2xl shadow-sm border border-silver-200/70 p-5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-midnight-800 mb-3">Account</h2>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-midnight-700 hover:bg-silver-100 border border-silver-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
