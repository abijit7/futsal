import { FormEvent, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/login', { replace: true, state: { message: 'Account created successfully. Log in to verify your email and phone.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)]" style={{ background: 'var(--background)' }}>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
        <form className="w-full max-w-2xl rounded-3xl border bg-white p-7 shadow-sm sm:p-8" style={{ borderColor: 'var(--border)' }} onSubmit={submit}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--futsal-green)' }}>Join the pitch</p>
          <h1 className="mt-2 text-4xl font-black uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--futsal-navy)' }}>Create Account</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>Start booking futsal courts and managing sessions instantly.</p>
          {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label" htmlFor="register-name">Full name</span>
              <span className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <UserRound size={16} style={{ color: 'var(--muted-foreground)' }} />
                <input id="register-name" className="flex-1 bg-transparent text-sm outline-none" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </span>
            </label>
            <label className="block">
              <span className="label" htmlFor="register-phone">Phone</span>
              <span className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <Phone size={16} style={{ color: 'var(--muted-foreground)' }} />
                <input id="register-phone" className="flex-1 bg-transparent text-sm outline-none" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </span>
            </label>
            <label className="block">
              <span className="label" htmlFor="register-email">Email</span>
              <span className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <Mail size={16} style={{ color: 'var(--muted-foreground)' }} />
                <input id="register-email" className="flex-1 bg-transparent text-sm outline-none" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </span>
            </label>
            <label className="block">
              <span className="label" htmlFor="register-password">Password</span>
              <span className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
                <input id="register-password" className="flex-1 bg-transparent text-sm outline-none" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </span>
            </label>
          </div>

          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Get Started'}
          </button>
          <p className="mt-5 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Already have an account? <Link className="font-semibold" style={{ color: 'var(--futsal-green)' }} to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Field({
  icon,
  label,
  onChange,
  type = 'text',
  value
}: {
  icon?: ReactNode;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}>
        {icon && <span style={{ color: 'var(--muted-foreground)' }}>{icon}</span>}
        <input className="flex-1 bg-transparent text-sm outline-none" type={type} value={value} onChange={(event) => onChange(event.target.value)} required />
      </span>
    </label>
  );
}
