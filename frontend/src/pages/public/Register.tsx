import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Phone, UserRound } from 'lucide-react';
import { Button, Field } from '../../components/UI';
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
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Log in to verify your email and phone.' }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-page py-10 lg:py-16">
      <form className="panel mx-auto w-full max-w-2xl p-6 sm:p-8" onSubmit={submit}>
        <p className="eyebrow">Join the pitch</p>
        <h1 className="mt-2 text-4xl font-black uppercase text-slate-950" style={{ fontFamily: 'var(--font-display)' }}>Create Account</h1>
        <p className="mt-2 text-sm text-slate-500">Start booking futsal courts and managing sessions instantly.</p>

        {error && (
          <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{error}</p>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Full name"
            required
            autoComplete="name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            prefix={<UserRound size={18} />}
          />
          <Field
            label="Phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            helper="10 digits starting with 98, 97, or 96."
            prefix={<Phone size={18} />}
          />
          <Field
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            prefix={<Mail size={18} />}
          />
          <Field
            label="Password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            helper="At least 8 characters."
            prefix={<KeyRound size={18} />}
          />
        </div>

        <Button type="submit" className="mt-6 w-full" loading={loading}>Get Started</Button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link className="font-bold text-green-700 hover:text-green-800" to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
