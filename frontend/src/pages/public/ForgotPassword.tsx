import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/modules';
import { Button, Field } from '../../components/UI';
import { PasswordField, PasswordRequirements } from '../../components/PasswordControls';
import { validateEmail, validatePassword } from '../../utils/validation';

export function ForgotPassword() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devCode, setDevCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const navigate = useNavigate();

  // A reset must not be a way around the rules sign-up enforces, so it runs the same checks.
  const errors = useMemo(() => {
    const next: { email?: string; password?: string; confirmPassword?: string } = {};
    const emailError = validateEmail(email);
    if (emailError) next.email = emailError;
    if (step === 'reset') {
      const passwordError = validatePassword(password, { email });
      if (passwordError) next.password = passwordError;
      if (!confirmPassword) next.confirmPassword = 'Confirm your new password.';
      else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    }
    return next;
  }, [step, email, password, confirmPassword]);

  const shownError = (field: keyof typeof touched) => (touched[field] ? errors[field] : undefined);
  const markTouched = (field: keyof typeof touched) => () => setTouched((current) => ({ ...current, [field]: true }));

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setTouched((current) => ({ ...current, email: true }));
    if (errors.email) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.forgotPassword(email);
      setMessage(response.message);
      setDevCode(response.devCode || '');
      if (response.devCode) setCode(response.devCode);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request reset code');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    if (Object.keys(errors).length > 0) return;
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ email, code, newPassword: password });
      navigate('/login', { replace: true, state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-page grid place-items-center py-10 lg:py-16">
      <section className="panel w-full max-w-lg overflow-hidden">
        <div className="bg-slate-950 p-8 text-white">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-400/15 text-green-300"><KeyRound size={28} /></div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Account recovery</p>
          <h1 className="mt-2 text-3xl font-black">Reset your password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Request a six-digit code, then choose a new secure password.</p>
        </div>

        <form className="p-8" onSubmit={step === 'request' ? requestCode : resetPassword} noValidate>
          {error && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
          {message && <div className="mb-5 flex gap-3 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700"><CheckCircle2 className="shrink-0" size={19} /> {message}</div>}
          {import.meta.env.DEV && devCode && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Development code:</strong> {devCode}</div>}

          <Field
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={markTouched('email')}
            error={shownError('email')}
            aria-invalid={Boolean(shownError('email'))}
            disabled={step === 'reset'}
            prefix={<Mail size={18} />}
          />

          {step === 'reset' && (
            <div className="mt-5 grid gap-4">
              <Field
                label="Six-digit code"
                inputMode="numeric"
                maxLength={6}
                required
                className="[&_input]:tracking-[0.35em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
              <PasswordField
                label="New password"
                autoComplete="new-password"
                required
                value={password}
                onChange={setPassword}
                onBlur={markTouched('password')}
                error={shownError('password')}
              />
              <PasswordField
                label="Confirm new password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={setConfirmPassword}
                onBlur={markTouched('confirmPassword')}
                error={shownError('confirmPassword')}
              />
              <PasswordRequirements
                password={password}
                context={{ email }}
                matches={password === confirmPassword && Boolean(confirmPassword)}
              />
            </div>
          )}

          <Button type="submit" className="mt-6 w-full" loading={loading}>
            {step === 'request' ? 'Send reset code' : 'Reset password'} <ShieldCheck size={18} />
          </Button>
          {step === 'reset' && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => { setStep('request'); setMessage(''); setDevCode(''); setCode(''); }}
            >
              Use another email
            </Button>
          )}
          <p className="mt-6 text-center text-sm text-slate-500">Remembered your password? <Link className="font-bold text-green-700 hover:text-green-800" to="/login">Back to login</Link></p>
        </form>
      </section>
    </main>
  );
}
