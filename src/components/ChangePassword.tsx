import { useState, type FormEvent } from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Self-service password change for the signed-in user. Verifies the current
 * password by re-authenticating, then sets the new one via Supabase Auth. The
 * session stays valid, so she is not signed out.
 */
export default function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const reset = () => setDone(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setDone(false);
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next === current) { setError('New password must be different from the current one.'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email;
      if (!email) { setError('Could not verify your account. Please sign out and back in, then try again.'); return; }
      // Confirm the current password is correct by re-authenticating.
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: current });
      if (reauthError) { setError('Current password is incorrect.'); return; }
      // Set the new password.
      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) { setError(updateError.message || 'Could not update your password. Please try again.'); return; }
      setDone(true); setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-silver-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-silver-200/70 p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-midnight-800 mb-3">Change password</h2>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-xs font-medium text-silver-600 mb-1">Current password</label>
          <input type={show ? 'text' : 'password'} value={current} onChange={(e) => { setCurrent(e.target.value); reset(); }} className={inputClass} autoComplete="current-password" />
        </div>
        <div>
          <label className="block text-xs font-medium text-silver-600 mb-1">New password</label>
          <input type={show ? 'text' : 'password'} value={next} onChange={(e) => { setNext(e.target.value); reset(); }} className={inputClass} autoComplete="new-password" placeholder="At least 8 characters" />
        </div>
        <div>
          <label className="block text-xs font-medium text-silver-600 mb-1">Confirm new password</label>
          <input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => { setConfirm(e.target.value); reset(); }} className={inputClass} autoComplete="new-password" />
        </div>
        <label className="flex items-center gap-2 text-xs text-silver-600 cursor-pointer select-none">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="w-3.5 h-3.5 rounded border-silver-300 text-flame-600 focus:ring-flame-500" />
          Show passwords
        </label>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        {done && <div className="flex items-center gap-1.5 text-sm text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Password updated.</div>}
        <button type="submit" disabled={saving || !current || !next || !confirm} className="inline-flex items-center gap-2 bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors">
          <KeyRound className="w-4 h-4" /> {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
