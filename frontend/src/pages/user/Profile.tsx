import { CheckCircle2, KeyRound, Mail, Phone, RefreshCw, Save, ShieldAlert, ShieldCheck, UserRound } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/modules';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types/api';

type VerificationChannel = 'email' | 'phone';

type VerificationState = {
  code: string;
  devCode: string;
  message: string;
  loading: boolean;
};

const emptyVerification: VerificationState = { code: '', devCode: '', message: '', loading: false };

export function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [emailVerification, setEmailVerification] = useState<VerificationState>(emptyVerification);
  const [phoneVerification, setPhoneVerification] = useState<VerificationState>(emptyVerification);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const mergeUser = (updated: User) => {
    if (!user) return;
    setUser({ ...user, ...updated, authToken: user.authToken });
  };

  useEffect(() => {
    if (!user) return;
    userApi.get(user.userId).then((fresh) => {
      mergeUser(fresh);
      setProfile({ name: fresh.name, phone: fresh.phone });
    }).catch(() => undefined);
  }, [user?.userId]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileMessage('');
    setError('');
    try {
      const updated = await userApi.update(user.userId, profile);
      mergeUser(updated);
      setProfileMessage('Profile details updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setPasswordMessage('');
    setError('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await userApi.changePassword(user.userId, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswordMessage(response.message);
      logout();
      navigate('/login', { replace: true, state: { message: response.message } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  const updateVerification = (channel: VerificationChannel, next: Partial<VerificationState>) => {
    const setter = channel === 'email' ? setEmailVerification : setPhoneVerification;
    setter((current) => ({ ...current, ...next }));
  };

  const requestVerification = async (channel: VerificationChannel) => {
    if (!user) return;
    setError('');
    updateVerification(channel, { loading: true, message: '', devCode: '' });
    try {
      const response = channel === 'email'
        ? await userApi.requestEmailVerification(user.userId)
        : await userApi.requestPhoneVerification(user.userId);
      updateVerification(channel, {
        loading: false,
        message: response.message,
        devCode: response.devCode || '',
        code: response.devCode || ''
      });
    } catch (err) {
      updateVerification(channel, { loading: false });
      setError(err instanceof Error ? err.message : 'Could not request verification code');
    }
  };

  const confirmVerification = async (channel: VerificationChannel) => {
    if (!user) return;
    const state = channel === 'email' ? emailVerification : phoneVerification;
    setError('');
    updateVerification(channel, { loading: true });
    try {
      const updated = channel === 'email'
        ? await userApi.confirmEmailVerification(user.userId, state.code)
        : await userApi.confirmPhoneVerification(user.userId, state.code);
      mergeUser(updated);
      updateVerification(channel, { loading: false, code: '', devCode: '', message: `${channel === 'email' ? 'Email' : 'Phone'} verified successfully.` });
    } catch (err) {
      updateVerification(channel, { loading: false });
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  if (!user) return null;

  return (
    <main className="container-page py-10">
      <section className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white md:p-10">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Customer account</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Profile and security</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Keep your contact details accurate, verify your account, and protect access to your bookings.</p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-green-300 ring-1 ring-white/10"><UserRound size={38} /></div>
        </div>
      </section>

      {error && <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"><ShieldAlert className="shrink-0" size={20} /> {error}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <form className="panel p-7" onSubmit={saveProfile}>
          <div className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600"><UserRound size={21} /></div><div><h2 className="text-xl font-black text-slate-950">Personal details</h2><p className="text-sm text-slate-500">Information used for bookings and contact.</p></div></div>
          {profileMessage && <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">{profileMessage}</div>}
          <div className="grid gap-5">
            <div><label className="label">Full name</label><input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></div>
            <div><label className="label">Email address</label><div className="relative"><Mail className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input bg-slate-50 pl-11 text-slate-500" value={user.email} disabled /></div><p className="mt-2 text-xs text-slate-400">Email changes require a separate account-support flow.</p></div>
            <div><label className="label">Phone number</label><div className="relative"><Phone className="absolute left-4 top-3.5 text-slate-400" size={18} /><input className="input pl-11" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required /></div><p className="mt-2 text-xs text-slate-400">Changing your phone number resets its verification status.</p></div>
          </div>
          <button className="btn-primary mt-6" disabled={profileLoading}><Save size={18} /> {profileLoading ? 'Saving...' : 'Save profile'}</button>
        </form>

        <section className="panel p-7">
          <div className="mb-6 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600"><ShieldCheck size={21} /></div><div><h2 className="text-xl font-black text-slate-950">Contact verification</h2><p className="text-sm text-slate-500">Confirm that both contact channels belong to you.</p></div></div>
          <div className="grid gap-4">
            <VerificationCard
              title="Email address"
              value={user.email}
              verified={user.emailVerified}
              icon={<Mail size={21} />}
              state={emailVerification}
              onCode={(code) => updateVerification('email', { code })}
              onRequest={() => requestVerification('email')}
              onConfirm={() => confirmVerification('email')}
            />
            <VerificationCard
              title="Phone number"
              value={user.phone}
              verified={user.phoneVerified}
              icon={<Phone size={21} />}
              state={phoneVerification}
              onCode={(code) => updateVerification('phone', { code })}
              onRequest={() => requestVerification('phone')}
              onConfirm={() => confirmVerification('phone')}
            />
          </div>
        </section>

        <form className="panel p-7 xl:col-span-2" onSubmit={changePassword}>
          <div className="grid gap-7 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-green-300"><KeyRound size={23} /></div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">Change password</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Enter your current password before setting a new one. All existing sessions will be signed out.</p>
              {passwordMessage && <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">{passwordMessage}</div>}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div><label className="label">Current password</label><input className="input" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></div>
              <div><label className="label">New password</label><input className="input" type="password" minLength={8} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required /></div>
              <div><label className="label">Confirm password</label><input className="input" type="password" minLength={8} value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required /></div>
              <button className="btn-navy md:col-span-3 md:justify-self-end" disabled={passwordLoading}><RefreshCw size={18} /> {passwordLoading ? 'Changing...' : 'Change password'}</button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function VerificationCard({
  title,
  value,
  verified,
  icon,
  state,
  onCode,
  onRequest,
  onConfirm
}: {
  title: string;
  value: string;
  verified: boolean;
  icon: ReactNode;
  state: VerificationState;
  onCode: (code: string) => void;
  onRequest: () => void;
  onConfirm: () => void;
}) {
  return (
    <article className={`rounded-3xl border p-5 ${verified ? 'border-green-200 bg-green-50/70' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${verified ? 'bg-green-600 text-white' : 'bg-white text-slate-500'}`}>{icon}</div><div className="min-w-0"><h3 className="font-black text-slate-950">{title}</h3><p className="truncate text-sm text-slate-500">{value}</p></div></div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase ${verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{verified && <CheckCircle2 size={14} />}{verified ? 'Verified' : 'Not verified'}</span>
      </div>
      {!verified && (
        <div className="mt-5">
          {state.message && <p className="mb-3 text-sm font-bold text-green-700">{state.message}</p>}
          {state.devCode && <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><strong>Development code:</strong> {state.devCode}</p>}
          {state.message ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input className="input tracking-[0.3em]" inputMode="numeric" maxLength={6} placeholder="000000" value={state.code} onChange={(e) => onCode(e.target.value.replace(/\D/g, ''))} />
              <button type="button" className="btn-primary px-4" disabled={state.loading || state.code.length !== 6} onClick={onConfirm}>Confirm</button>
            </div>
          ) : (
            <button type="button" className="btn-soft w-full" disabled={state.loading} onClick={onRequest}>{state.loading ? 'Sending...' : 'Send verification code'}</button>
          )}
          {state.message && <button type="button" className="mt-3 text-xs font-black text-slate-500 hover:text-green-700" disabled={state.loading} onClick={onRequest}>Resend code</button>}
        </div>
      )}
    </article>
  );
}
