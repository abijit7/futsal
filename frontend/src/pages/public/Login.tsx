import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const redirect = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(redirect || (user.role === 'ADMIN' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)]" style={{ background: 'var(--background)' }}>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden overflow-hidden rounded-3xl p-10 text-white shadow-2xl lg:block" style={{ background: 'linear-gradient(135deg, var(--futsal-navy) 0%, var(--futsal-navy-mid) 65%, rgba(22,163,74,0.55) 100%)' }}>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--futsal-green)' }}>
              <Search size={18} />
            </div>
            <span className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>FUTSALGO</span>
          </div>
          <h1 className="mt-20 max-w-lg text-6xl font-black uppercase leading-none" style={{ fontFamily: 'var(--font-display)' }}>
            Book courts faster with your player account.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8" style={{ color: '#94A3B8' }}>
            Manage bookings, payments, verification, and venue access from one clean dashboard.
          </p>
        </section>

        <form onSubmit={submit} className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm sm:p-8" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--futsal-green)' }}>Welcome back</p>
          <h2 className="mt-2 text-4xl font-black uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--futsal-navy)' }}>Sign In</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Access bookings, payments, and dashboards.</p>

          {successMessage && <div className="mt-5 rounded-2xl p-4 text-sm font-semibold" style={{ background: 'var(--secondary)', color: 'var(--futsal-green-dark)' }}>{successMessage}</div>}
          {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

          <div className="mt-6 space-y-4">
            <label className="block">
              <label className="label" htmlFor="login-email">Email</label>
              <span className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <Mail size={16} style={{ color: 'var(--muted-foreground)' }} />
                <input id="login-email" className="flex-1 bg-transparent text-sm outline-none" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </span>
            </label>
            <label className="block">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="label" htmlFor="login-password">Password</label>
                <Link className="normal-case tracking-normal font-semibold" style={{ color: 'var(--futsal-green)' }} to="/forgot-password">Forgot?</Link>
              </div>
              <span className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <Lock size={16} style={{ color: 'var(--muted-foreground)' }} />
                <input id="login-password" className="flex-1 bg-transparent text-sm outline-none" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </span>
            </label>
          </div>

          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="mt-5 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            New here? <Link className="font-semibold" style={{ color: 'var(--futsal-green)' }} to="/register">Create account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
