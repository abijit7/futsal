import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { Button, Field } from '../../components/UI';
import { BRAND_DISPLAY } from '../../constants/brand';
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
    <main className="container-page py-10 lg:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_440px]">
        <section
          className="hidden overflow-hidden rounded-3xl p-10 text-white shadow-xl lg:block"
          style={{ background: 'linear-gradient(135deg, var(--futsal-navy) 0%, var(--futsal-navy-mid) 65%, rgba(22,163,74,0.55) 100%)' }}
        >
          <div className="flex items-center gap-2">
            <BrandMark size={40} />
            <span className="text-2xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>{BRAND_DISPLAY}</span>
          </div>
          <h2 className="mt-16 max-w-lg text-5xl font-black uppercase leading-none" style={{ fontFamily: 'var(--font-display)' }}>
            Book courts faster with your player account.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
            Manage bookings, payments, verification, and venue access from one clean dashboard.
          </p>
        </section>

        <form onSubmit={submit} className="panel mx-auto w-full max-w-md p-6 sm:p-8">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 text-4xl font-black uppercase text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>Sign In</h1>
          <p className="mt-2 text-sm text-slate-500">Access bookings, payments, and dashboards.</p>

          {successMessage && (
            <p className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700" role="status">{successMessage}</p>
          )}
          {error && (
            <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{error}</p>
          )}

          <div className="mt-6 grid gap-4">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              prefix={<Mail size={18} />}
            />
            <div>
              <Field
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                prefix={<Lock size={18} />}
              />
              <div className="mt-2 text-right">
                <Link className="text-sm font-bold text-green-700 hover:text-green-800" to="/forgot-password">Forgot password?</Link>
              </div>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" loading={loading}>Sign In</Button>

          <p className="mt-5 text-center text-sm text-slate-500">
            New here? <Link className="font-bold text-green-700 hover:text-green-800" to="/register">Create account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
