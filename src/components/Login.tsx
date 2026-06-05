import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already signed in? Skip the form.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-midnight-950 flex items-center justify-center p-4 font-sans text-silver-300"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(189,135,23,0.10), transparent 60%), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(21,41,74,0.6), transparent 70%)',
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="font-display text-3xl text-silver-100">Stephanie Shaffer</p>
          <p className="text-[10px] tracking-[0.32em] uppercase text-flame-400 mt-3">
            Realtor <span className="text-silver-400">·</span> Coldwell Banker
          </p>
        </div>

        <div className="bg-midnight-900/60 backdrop-blur border border-midnight-700/50 rounded-2xl p-8 shadow-2xl">
          <h2 className="font-display text-xl text-silver-100 mb-6">Agent sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-silver-400 mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-midnight-950/60 border border-midnight-700 rounded-lg text-silver-100 placeholder-silver-400/60 focus:outline-none focus:ring-1 focus:ring-flame-500 focus:border-flame-500 transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.18em] text-silver-400 mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-midnight-950/60 border border-midnight-700 rounded-lg text-silver-100 placeholder-silver-400/60 focus:outline-none focus:ring-1 focus:ring-flame-500 focus:border-flame-500 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-flame-500/10 border border-flame-500/30 text-flame-300 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-flame-500 hover:bg-flame-600 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-3 text-sm uppercase tracking-[0.12em] shadow-flame-glow transition-all"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-silver-400 text-xs mt-6">
          &copy; {new Date().getFullYear()} Stephanie Shaffer
        </p>
      </div>
    </div>
  );
}
