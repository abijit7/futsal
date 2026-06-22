import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
    <main className="container-page grid min-h-[calc(100vh-5rem)] place-items-center py-10">
      <form className="panel w-full max-w-md p-8" onSubmit={submit}>
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Login to MeroFutsal</h1>
        <p className="mt-2 text-sm text-slate-500">Access booking, payments, and admin tools.</p>
        {successMessage && <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">{successMessage}</div>}
        {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
        <div className="mt-6">
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-bold text-slate-700">Password</label>
            <Link className="text-sm font-black text-green-700 hover:text-green-800" to="/forgot-password">Forgot password?</Link>
          </div>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        <p className="mt-5 text-center text-sm text-slate-500">New here? <Link className="font-black text-green-700" to="/register">Create account</Link></p>
      </form>
    </main>
  );
}
