import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, Phone, RefreshCw, Save, ShieldCheck, UserRound, XCircle } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/modules';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { Button, Chip, Field, ModalShell, PageHero } from '../../components/UI';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types/api';
import { formatDate } from '../../utils/format';

type VerificationChannel = 'email' | 'phone';

type VerificationState = {
  code: string;
  devCode: string;
  message: string;
  loading: boolean;
};

type ProfileForm = {
  name: string;
  phone: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyVerification: VerificationState = { code: '', devCode: '', message: '', loading: false };
const emptyPasswords: PasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
const phonePattern = /^(98|97|96)\d{8}$/;
const namePattern = /^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/;

const settingsLinks = [
  ['Summary', 'summary'],
  ['Personal', 'personal'],
  ['Security', 'security'],
  ['Verification', 'verification'],
  ['Account', 'account']
] as const;

export function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [initialProfile, setInitialProfile] = useState<ProfileForm>({ name: user?.name || '', phone: user?.phone || '' });
  const [profile, setProfile] = useState<ProfileForm>({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState<PasswordForm>(emptyPasswords);
  const [emailVerification, setEmailVerification] = useState<VerificationState>(emptyVerification);
  const [phoneVerification, setPhoneVerification] = useState<VerificationState>(emptyVerification);
  const [feedback, setFeedback] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const mergeUser = (updated: User) => {
    if (!user) return;
    setUser({ ...user, ...updated, authToken: user.authToken });
  };

  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    userApi.get(user.userId).then((fresh) => {
      mergeUser(fresh);
      const next = { name: fresh.name, phone: fresh.phone };
      setProfile(next);
      setInitialProfile(next);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not refresh your account details.');
    }).finally(() => setLoadingProfile(false));
  }, [user?.userId]);

  const profileDirty = profile.name !== initialProfile.name || profile.phone !== initialProfile.phone;
  const passwordDirty = Boolean(passwords.currentPassword || passwords.newPassword || passwords.confirmPassword);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!profileDirty && !passwordDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [profileDirty, passwordDirty]);

  const profileErrors = useMemo(() => {
    const next: Partial<Record<keyof ProfileForm, string>> = {};
    const name = profile.name.trim();
    const phone = profile.phone.trim();
    if (!name) next.name = 'Full name is required.';
    else if (name.length < 5 || name.length > 50 || !namePattern.test(name)) next.name = 'Use first and last name, letters only, 5-50 characters.';
    if (!phone) next.phone = 'Phone number is required.';
    else if (!phonePattern.test(phone)) next.phone = 'Enter a valid 10-digit phone number starting with 98, 97, or 96.';
    return next;
  }, [profile]);

  const passwordErrors = useMemo(() => {
    const next: Partial<Record<keyof PasswordForm, string>> = {};
    if (!passwordDirty) return next;
    if (!passwords.currentPassword) next.currentPassword = 'Current password is required by the backend.';
    if (!passwords.newPassword) next.newPassword = 'New password is required.';
    else if (passwords.newPassword.length < 8 || passwords.newPassword.length > 72) next.newPassword = 'Use 8-72 characters.';
    if (!passwords.confirmPassword) next.confirmPassword = 'Confirm your new password.';
    else if (passwords.newPassword !== passwords.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    return next;
  }, [passwordDirty, passwords]);

  const profileValid = Object.keys(profileErrors).length === 0;
  const passwordValid = passwordDirty && Object.keys(passwordErrors).length === 0;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !profileDirty || !profileValid) return;
    setSavingProfile(true);
    setFeedback('');
    setError('');
    const payload: { name?: string; phone?: string } = {};
    if (profile.name.trim() !== initialProfile.name) payload.name = profile.name.trim();
    if (profile.phone.trim() !== initialProfile.phone) payload.phone = profile.phone.trim();
    try {
      const updated = await userApi.update(user.userId, payload);
      mergeUser(updated);
      const next = { name: updated.name, phone: updated.phone };
      setProfile(next);
      setInitialProfile(next);
      setFeedback('Profile details saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !passwordValid) return;
    setSavingPassword(true);
    setPasswordFeedback('');
    setError('');
    try {
      const response = await userApi.changePassword(user.userId, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswordFeedback(response.message);
      setPasswords(emptyPasswords);
      logout();
      navigate('/login', { replace: true, state: { message: response.message } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  const resetProfile = () => {
    setProfile(initialProfile);
    setFeedback('');
    setError('');
    setConfirmReset(false);
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
      setError(err instanceof Error ? err.message : 'Could not request verification code.');
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
      setError(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  if (!user) {
    return (
      <main className="container-page py-10">
        <EmptyState title="No active session" description="Sign in to manage profile settings." />
      </main>
    );
  }

  return (
    <main className="container-page py-8 md:py-10">
      <PageHero
        eyebrow="Account settings"
        title="Profile settings"
        description="Manage your personal information and account preferences."
        icon={<UserRound size={36} />}
        action={<StatusBadge status="ACTIVE" label="Account active" />}
      />

      {error && <div className="mb-6"><ErrorState message={error} /></div>}
      {(feedback || passwordFeedback) && (
        <div className="mb-6 rounded-3xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700" aria-live="polite">
          {feedback || passwordFeedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-max">
          <nav className="panel hidden p-3 lg:block" aria-label="Profile settings sections">
            {settingsLinks.map(([label, id]) => (
              <a key={id} href={`#${id}`} className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
                {label}
              </a>
            ))}
          </nav>
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:hidden" aria-label="Profile settings sections">
            {settingsLinks.map(([label, id]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600">
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {loadingProfile ? (
          <LoadingState label="Loading profile settings" />
        ) : (
          <div className="grid gap-6">
            <ProfileSummary user={user} />

            <SectionCard id="personal" eyebrow="Profile" title="Personal information" description="These details are used for bookings, account recovery, and venue communication.">
              <form onSubmit={saveProfile} className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Full name"
                    required
                    value={profile.name}
                    onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                    helper="Use your first and last name."
                    error={profileErrors.name}
                    prefix={<UserRound size={18} />}
                    aria-invalid={Boolean(profileErrors.name)}
                  />
                  <Field
                    label="Phone number"
                    required
                    inputMode="tel"
                    value={profile.phone}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value.replace(/[^\d]/g, '').slice(0, 10) })}
                    helper="10 digits starting with 98, 97, or 96."
                    error={profileErrors.phone}
                    prefix={<Phone size={18} />}
                    aria-invalid={Boolean(profileErrors.phone)}
                  />
                </div>
                <ReadonlyField label="Email address" value={user.email} icon={<Mail size={18} />} badge="Read only" helper="Email changes are not supported by the current backend profile endpoint." />
                <SaveBar dirty={profileDirty} valid={profileValid} loading={savingProfile} onReset={() => setConfirmReset(true)} />
              </form>
            </SectionCard>

            <SectionCard id="security" eyebrow="Security" title="Password and security" description="Change your password using the backend password endpoint. Leave this section blank to keep your current password.">
              <form onSubmit={changePassword} className="grid gap-5">
                <div className="grid gap-5 lg:grid-cols-3">
                  <PasswordField label="Current password" value={passwords.currentPassword} visible={showCurrent} onToggle={() => setShowCurrent((value) => !value)} onChange={(value) => setPasswords({ ...passwords, currentPassword: value })} error={passwordErrors.currentPassword} />
                  <PasswordField label="New password" value={passwords.newPassword} visible={showNew} onToggle={() => setShowNew((value) => !value)} onChange={(value) => setPasswords({ ...passwords, newPassword: value })} error={passwordErrors.newPassword} />
                  <PasswordField label="Confirm new password" value={passwords.confirmPassword} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} onChange={(value) => setPasswords({ ...passwords, confirmPassword: value })} error={passwordErrors.confirmPassword} />
                </div>
                <PasswordRequirements password={passwords.newPassword} matches={passwords.newPassword === passwords.confirmPassword && Boolean(passwords.confirmPassword)} />
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" disabled={!passwordDirty || savingPassword} onClick={() => setPasswords(emptyPasswords)}>Clear</Button>
                  <Button type="submit" variant="secondary" disabled={!passwordValid || savingPassword} loading={savingPassword}>
                    <RefreshCw size={18} />
                    Change password
                  </Button>
                </div>
              </form>
            </SectionCard>

            <SectionCard id="verification" eyebrow="Trust" title="Contact verification" description="Confirm that both contact channels belong to you.">
              <div className="grid gap-4 lg:grid-cols-2">
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
            </SectionCard>

            <SectionCard id="account" eyebrow="System details" title="Account information" description="Read-only information controlled by the platform.">
              <dl className="grid gap-3 md:grid-cols-2">
                <DetailRow label="User ID" value={String(user.userId)} />
                <DetailRow label="Role" value={user.role} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Account status" value="Active" />
                <DetailRow label="Email verification" value={user.emailVerified ? 'Verified' : 'Not verified'} />
                <DetailRow label="Phone verification" value={user.phoneVerified ? 'Verified' : 'Not verified'} />
                <DetailRow label="Member since" value={user.createdAt ? formatDate(user.createdAt) : 'Not recorded'} />
              </dl>
            </SectionCard>
          </div>
        )}
      </div>

      {confirmReset && (
        <ModalShell
          title="Discard profile changes?"
          eyebrow="Unsaved changes"
          description="Your edited name and phone number will be reset to the last saved values."
          onClose={() => setConfirmReset(false)}
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => setConfirmReset(false)}>Keep editing</Button>
              <Button type="button" variant="destructive" onClick={resetProfile}>Discard changes</Button>
            </>
          )}
        >
          <p className="text-sm font-semibold leading-6 text-slate-500">This only affects unsaved local edits. Saved account details remain unchanged.</p>
        </ModalShell>
      )}
    </main>
  );
}

function ProfileSummary({ user }: { user: User }) {
  const completion = [user.name, user.email, user.phone, user.emailVerified, user.phoneVerified].filter(Boolean).length;
  return (
    <section id="summary" className="panel overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-green-50 text-xl font-black text-green-700 ring-1 ring-green-100">
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black text-slate-950">{user.name}</h2>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip tone={user.role === 'ADMIN' ? 'navy' : 'slate'}>{user.role}</Chip>
              <Chip tone={user.phoneVerified && user.emailVerified ? 'green' : 'amber'}>{user.phoneVerified && user.emailVerified ? 'Verified contact' : 'Verification pending'}</Chip>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 sm:w-56">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Profile completion</p>
          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-green-600" style={{ width: `${Math.round((completion / 5) * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm font-black text-slate-700">{Math.round((completion / 5) * 100)}% complete</p>
        </div>
      </div>
    </section>
  );
}

function SectionCard({ id, eyebrow, title, description, children }: { id: string; eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} className="panel scroll-mt-24 overflow-hidden">
      <div className="border-b border-slate-200 bg-white p-5">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">{description}</p>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function ReadonlyField({ label, value, icon, badge, helper }: { label: string; value: string; icon: ReactNode; badge: string; helper: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="label mb-0">{label}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
          <LockKeyhole size={13} />
          {badge}
        </span>
      </div>
      <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600">
        <span className="shrink-0 text-slate-400">{icon}</span>
        <span className="min-w-0 truncate">{value}</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-400">{helper}</p>
    </div>
  );
}

function SaveBar({ dirty, valid, loading, onReset }: { dirty: boolean; valid: boolean; loading: boolean; onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">{dirty ? 'You have unsaved profile changes.' : 'No unsaved profile changes.'}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" disabled={!dirty || loading} onClick={onReset}>Reset</Button>
          <Button type="submit" disabled={!dirty || !valid || loading} loading={loading}>
            <Save size={18} />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, visible, onToggle, onChange, error }: { label: string; value: string; visible: boolean; onToggle: () => void; onChange: (value: string) => void; error?: string }) {
  return (
    <div>
      <Field
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        prefix={<KeyRound size={18} />}
        suffix={(
          <button type="button" className="rounded-full p-1 text-slate-500 hover:text-slate-950 focus:outline-none focus:ring-4 focus:ring-green-100" aria-label={visible ? `Hide ${label}` : `Show ${label}`} onClick={onToggle}>
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
        aria-invalid={Boolean(error)}
      />
    </div>
  );
}

function PasswordRequirements({ password, matches }: { password: string; matches: boolean }) {
  return (
    <div className="grid gap-2 rounded-3xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 sm:grid-cols-2">
      <Requirement met={password.length >= 8}>At least 8 characters</Requirement>
      <Requirement met={password.length <= 72}>72 characters or fewer</Requirement>
      <Requirement met={/[A-Za-z]/.test(password)}>Contains letters</Requirement>
      <Requirement met={matches}>Confirmation matches</Requirement>
    </div>
  );
}

function Requirement({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-2 ${met ? 'text-green-700' : 'text-slate-500'}`}>
      {met ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {children}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <dt className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</dt>
      <dd className="mt-2 break-words text-sm font-black text-slate-800">{value}</dd>
    </div>
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
        <div className="flex min-w-0 gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${verified ? 'bg-green-600 text-white' : 'bg-white text-slate-500'}`}>{icon}</div>
          <div className="min-w-0">
            <h3 className="font-black text-slate-950">{title}</h3>
            <p className="truncate text-sm font-semibold text-slate-500">{value}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase ${verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{verified && <CheckCircle2 size={14} />}{verified ? 'Verified' : 'Not verified'}</span>
      </div>
      {!verified && (
        <div className="mt-5">
          {state.message && <p className="mb-3 text-sm font-bold text-green-700" aria-live="polite">{state.message}</p>}
          {state.devCode && <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"><strong>Development code:</strong> {state.devCode}</p>}
          {state.message ? (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input className="input tracking-[0.3em]" aria-label={`${title} verification code`} inputMode="numeric" maxLength={6} placeholder="000000" value={state.code} onChange={(event) => onCode(event.target.value.replace(/\D/g, ''))} />
              <Button type="button" disabled={state.loading || state.code.length !== 6} onClick={onConfirm}>Confirm</Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full" disabled={state.loading} onClick={onRequest}>{state.loading ? 'Sending...' : 'Send verification code'}</Button>
          )}
          {state.message && <button type="button" className="mt-3 text-xs font-black text-slate-500 hover:text-green-700" disabled={state.loading} onClick={onRequest}>Resend code</button>}
        </div>
      )}
    </article>
  );
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}
