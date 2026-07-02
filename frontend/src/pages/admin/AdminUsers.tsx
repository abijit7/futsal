import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, Mail, Phone, Search, ShieldCheck, Trash2, UserRound, XCircle } from 'lucide-react';
import { userApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { AdminPageHeader, Button, Chip, Field, FilterBar, MetricCard, ModalShell, SelectField } from '../../components/UI';
import type { User } from '../../types/api';
import { formatDate } from '../../utils/format';

type RoleFilter = 'ALL' | 'USER' | 'ADMIN';

export function AdminUsers() {
  const [items, setItems] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [selected, setSelected] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userApi.list(page, 10);
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      setItems([]);
      setTotalPages(0);
      setError('Unable to load users. Check the backend connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [page]);

  const remove = async (id: number) => {
    setError('');
    try {
      await userApi.delete(id);
      await load();
    } catch {
      setError('User could not be deleted.');
    }
  };

  const filteredItems = items.filter((user) => {
    const haystack = `${user.name} ${user.email} ${user.phone}`.toLowerCase();
    const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
    const matchesRole = role === 'ALL' || user.role === role;
    return matchesSearch && matchesRole;
  });

  const counts = {
    total: items.length,
    admins: items.filter((user) => user.role === 'ADMIN').length,
    verifiedEmail: items.filter((user) => user.emailVerified).length,
    verifiedPhone: items.filter((user) => user.phoneVerified).length
  };

  return (
    <section className="space-y-5">
      <AdminPageHeader
        eyebrow="Access control"
        title="Users"
        description="Review customer accounts, admin roles, and verification status."
        meta={<Chip tone="green">{filteredItems.length} visible</Chip>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Loaded users" value={counts.total} icon={<UserRound size={20} />} tone="slate" />
        <MetricCard label="Admins" value={counts.admins} icon={<ShieldCheck size={20} />} tone="navy" />
        <MetricCard label="Email verified" value={counts.verifiedEmail} icon={<Mail size={20} />} tone="green" />
        <MetricCard label="Phone verified" value={counts.verifiedPhone} icon={<Phone size={20} />} tone="green" />
      </div>

      <FilterBar className="md:grid-cols-[1fr_220px_auto] md:items-end">
        <Field label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or phone" prefix={<Search size={18} />} />
        <SelectField label="Role" value={role} onChange={(event) => setRole(event.target.value as RoleFilter)}>
          <option value="ALL">All roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </SelectField>
        <Button type="button" variant="outline" onClick={() => { setSearch(''); setRole('ALL'); }}>Clear filters</Button>
      </FilterBar>

      {(search || role !== 'ALL') && (
        <div className="flex flex-wrap gap-2">
          {search && <Chip onRemove={() => setSearch('')}>Search: {search}</Chip>}
          {role !== 'ALL' && <Chip tone="green" onRemove={() => setRole('ALL')}>Role: {role}</Chip>}
        </div>
      )}

      {error && !loading && <ErrorState message={error} retry={load} />}
      {loading ? <LoadingState /> : !error && filteredItems.length === 0 ? <EmptyState title="No users found" description="No account matches the current filters." /> : (
        <>
          <div className="hidden md:block">
            <div className="table-wrap">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Verification</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="motion-stagger">
                  {filteredItems.map((user) => (
                    <tr key={user.userId} className="border-t border-slate-100 transition-colors hover:bg-slate-50">
                      <td className="p-4"><UserIdentity user={user} /></td>
                      <td className="p-4"><ContactBlock user={user} /></td>
                      <td className="p-4"><RoleBadge user={user} /></td>
                      <td className="p-4"><div className="flex flex-wrap gap-2"><VerificationGroup user={user} /></div></td>
                      <td className="p-4 font-semibold text-slate-500">{user.createdAt ? formatDate(user.createdAt) : 'Not recorded'}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelected(user)}><Eye size={16} /> View</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteTarget(user)}><Trash2 size={16} /> Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="motion-stagger grid gap-3 md:hidden">
            {filteredItems.map((user) => (
              <article key={user.userId} className="mobile-data-card">
                <div className="flex items-start justify-between gap-3">
                  <UserIdentity user={user} />
                  <RoleBadge user={user} />
                </div>
                <div className="mt-4"><ContactBlock user={user} /></div>
                <div className="mt-4 flex flex-wrap gap-2"><VerificationGroup user={user} /></div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setSelected(user)}><Eye size={16} /> View</Button>
                  <Button type="button" variant="destructive" size="sm" className="flex-1" onClick={() => setDeleteTarget(user)}><Trash2 size={16} /> Delete</Button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {selected && (
        <ModalShell title={selected.name} eyebrow="User details" description={`Account ID ${selected.userId}`} onClose={() => setSelected(null)}>
          <div className="grid gap-3">
            <ContactBlock user={selected} />
            <div className="flex flex-wrap gap-2"><RoleBadge user={selected} /><VerificationGroup user={selected} /></div>
            <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">Joined: {selected.createdAt ? formatDate(selected.createdAt) : 'Not recorded'}</p>
          </div>
        </ModalShell>
      )}

      {deleteTarget && (
        <ModalShell
          title={`Delete ${deleteTarget.name}?`}
          eyebrow="Confirm delete"
          description="This removes the user account if the backend allows it."
          onClose={() => setDeleteTarget(null)}
          footer={(
            <>
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={async () => { const target = deleteTarget; setDeleteTarget(null); await remove(target.userId); }}>Delete user</Button>
            </>
          )}
        >
          <p className="text-sm font-semibold leading-6 text-slate-500">Historical records may prevent deletion depending on backend rules.</p>
        </ModalShell>
      )}
    </section>
  );
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-sm font-black text-green-700">
        {initials(user.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-black text-slate-950">{user.name}</p>
        <p className="text-xs font-bold text-slate-400">ID {user.userId}</p>
      </div>
    </div>
  );
}

function ContactBlock({ user }: { user: User }) {
  return (
    <div className="grid gap-1 font-semibold text-slate-600">
      <span className="inline-flex min-w-0 items-center gap-2"><Mail size={14} className="shrink-0 text-green-600" /> <span className="truncate">{user.email}</span></span>
      <span className="inline-flex items-center gap-2"><Phone size={14} className="text-green-600" /> {user.phone}</span>
    </div>
  );
}

function RoleBadge({ user }: { user: User }) {
  const admin = user.role === 'ADMIN';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${admin ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
      <ShieldCheck size={14} />
      {user.role}
    </span>
  );
}

function VerificationGroup({ user }: { user: User }) {
  return (
    <>
      <VerificationBadge verified={user.emailVerified} label="Email" />
      <VerificationBadge verified={user.phoneVerified} label="Phone" />
    </>
  );
}

function VerificationBadge({ verified, label }: { verified: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${verified ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
      {verified ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  );
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}
