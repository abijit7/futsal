import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/modules';
import { Button, Field } from '../../components/UI';

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
  const navigate = useNavigate();

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
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
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
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

        <form className="p-8" onSubmit={step === 'request' ? requestCode : resetPassword}>
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
              <Field
                label="New password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                helper="At least 8 characters."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Field
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
