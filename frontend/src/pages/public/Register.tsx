import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, UserRound } from 'lucide-react';
import { Button, Field } from '../../components/UI';
import { PasswordField, PasswordRequirements } from '../../components/PasswordControls';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validateName, validatePassword, validatePhone } from '../../utils/validation';

type RegisterForm = { name: string; email: string; phone: string; password: string };

const emptyForm: RegisterForm = { name: '', email: '', phone: '', password: '' };
const untouched: Record<keyof RegisterForm, boolean> = { name: false, email: false, phone: false, password: false };

export function Register() {
  const [form, setForm] = useState<RegisterForm>(emptyForm);
  const [touched, setTouched] = useState(untouched);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Every rule the server would apply, applied here first so a mistake is a red line under the
  // field rather than a round trip that reports only whichever field the server checked first.
  const errors = useMemo(() => {
    const next: Partial<Record<keyof RegisterForm, string>> = {};
    const name = validateName(form.name);
    const phone = validatePhone(form.phone);
    const email = validateEmail(form.email);
    const password = validatePassword(form.password, { name: form.name, email: form.email });
    if (name) next.name = name;
    if (phone) next.phone = phone;
    if (email) next.email = email;
    if (password) next.password = password;
    return next;
  }, [form]);

  const valid = Object.keys(errors).length === 0;
  // Errors wait for a blur or a submit attempt: flagging the first keystroke of every field would
  // paint the form red before anyone has finished typing a single answer.
  const shownError = (field: keyof RegisterForm) => (touched[field] ? errors[field] : undefined);
  const markTouched = (field: keyof RegisterForm) => () => setTouched((current) => ({ ...current, [field]: true }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true });
    if (!valid) return;
    setError('');
    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
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
      <form className="panel mx-auto w-full max-w-2xl p-6 sm:p-8" onSubmit={submit} noValidate>
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
            onBlur={markTouched('name')}
            error={shownError('name')}
            aria-invalid={Boolean(shownError('name'))}
            helper="First and last name, letters only."
            prefix={<UserRound size={18} />}
          />
          <Field
            label="Phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            value={form.phone}
            // Matches the profile form: strip anything that isn't a digit as it is typed, so the
            // 10-digit rule is something the field enforces rather than merely describes.
            onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })}
            onBlur={markTouched('phone')}
            error={shownError('phone')}
            aria-invalid={Boolean(shownError('phone'))}
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
            onBlur={markTouched('email')}
            error={shownError('email')}
            aria-invalid={Boolean(shownError('email'))}
            helper="We send your verification code here, so it has to be an address you can open."
            prefix={<Mail size={18} />}
          />
          <PasswordField
            label="Password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            onBlur={markTouched('password')}
            error={shownError('password')}
          />
        </div>

        <div className="mt-4">
          <PasswordRequirements password={form.password} context={{ name: form.name, email: form.email }} />
        </div>

        <Button type="submit" className="mt-6 w-full" loading={loading}>Get Started</Button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link className="font-bold text-green-700 hover:text-green-800" to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
