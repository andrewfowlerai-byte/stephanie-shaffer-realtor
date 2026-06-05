import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { currentPushStatus, enablePush, type PushStatus } from '../lib/push';

/**
 * Compact "Enable Notifications" widget for the Dashboard. Reads the current
 * push status on mount, exposes a one-tap enable. iOS Safari only works when
 * the CRM is installed to the home screen as a PWA.
 */
export default function NotificationsToggle() {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    currentPushStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const next = await enablePush();
      setStatus(next);
    } finally {
      setBusy(false);
    }
  };

  if (status === null) {
    return null; // still loading
  }

  // Don't show the widget at all if push isn't supported in this browser.
  // We'd just confuse the user with an "unsupported" state forever.
  if (status === 'unsupported') return null;

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 p-4 flex items-center gap-3">
      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-l border-t border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-r border-t border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-l border-b border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r border-b border-amber-500/40 rounded-[2px]" aria-hidden="true" />

      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        status === 'subscribed' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-500'
      }`}>
        {status === 'subscribed' ? <BellRing className="w-5 h-5" /> : status === 'denied' ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-800">
          <span className="text-slate-400 mr-1.5">15</span>
          Push Notifications
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {status === 'subscribed' && 'Reminders will buzz this device.'}
          {status === 'unsubscribed' && 'Allow notifications so Dash can remind you.'}
          {status === 'denied' && 'Browser denied notifications. Enable them in browser settings.'}
        </p>
      </div>

      {status !== 'subscribed' && status !== 'denied' && (
        <button
          onClick={handleEnable}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white text-xs font-medium transition-colors flex-shrink-0"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
          Enable
        </button>
      )}
    </div>
  );
}
