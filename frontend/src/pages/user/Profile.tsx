import { FormEvent, useState } from 'react';
import { userApi } from '../../api/modules';
import { useAuth } from '../../context/AuthContext';

export function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const updated = await userApi.update(user.userId, form);
      setUser({ ...user, ...updated, authToken: user.authToken });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container-page py-10">
      <form className="panel mx-auto max-w-2xl p-8" onSubmit={submit}>
        <p className="eyebrow">Profile</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Account settings</h1>
        <p className="mt-2 text-sm text-slate-500">Email is not editable because the backend update DTO does not support it.</p>
        {message && <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">{message}</div>}
        {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
        <div className="mt-6 grid gap-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">New password</label><input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current password" /></div>
        </div>
        <button className="btn-primary mt-6" disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
      </form>
    </main>
  );
}
