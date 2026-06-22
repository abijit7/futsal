import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/modules';

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
    <main className="container-page grid min-h-[calc(100vh-5rem)] place-items-center py-10">
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
          {devCode && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><strong>Development code:</strong> {devCode}</div>}

          <div>
            <label className="label">Email address</label>
            <div className="relative"><Mail className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input pl-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={step === 'reset'} required /></div>
          </div>

          {step === 'reset' && (
            <div className="mt-5 grid gap-4">
              <div><label className="label">Six-digit code</label><input className="input tracking-[0.35em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></div>
              <div><label className="label">New password</label><input className="input" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <div><label className="label">Confirm new password</label><input className="input" type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
            </div>
          )}

          <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? 'Please wait...' : step === 'request' ? 'Send reset code' : 'Reset password'} <ShieldCheck size={18} /></button>
          {step === 'reset' && <button type="button" className="btn-soft mt-3 w-full" onClick={() => { setStep('request'); setMessage(''); setDevCode(''); setCode(''); }}>Use another email</button>}
          <p className="mt-6 text-center text-sm text-slate-500">Remembered your password? <Link className="font-black text-green-700" to="/login">Back to login</Link></p>
        </form>
      </section>
    </main>
  );
}
