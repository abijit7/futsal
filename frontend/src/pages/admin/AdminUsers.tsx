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
      const data = await userApi.list({ page, size: 10, q: search.trim() || undefined, role: role === 'ALL' ? undefined : role });
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
  // Debounced so typing in the search box does not fire one request per keystroke, matching
  // the behaviour already in AdminBookings. Filter changes still load immediately.
  useEffect(() => {
    const timer = window.setTimeout(load, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [page, search, role]);

  const remove = async (id: number) => {
    setError('');
    try {
      await userApi.delete(id);
      await load();
    } catch {
      setError('User could not be deleted.');
    }
  };

  const filteredItems = items;

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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Loaded users" value={counts.total} icon={<UserRound size={20} />} tone="slate" />
        <MetricCard label="Admins" value={counts.admins} icon={<ShieldCheck size={20} />} tone="navy" />
        <MetricCard label="Email verified" value={counts.verifiedEmail} icon={<Mail size={20} />} tone="green" />
        <MetricCard label="Phone verified" value={counts.verifiedPhone} icon={<Phone size={20} />} tone="green" />
      </div>

      <FilterBar className="md:grid-cols-[1fr_220px_auto] md:items-end">
        <Field label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or phone" prefix={<Search size={18} />} />
        <SelectField label="Role" value={role} onChange={(event) => { setRole(event.target.value as RoleFilter); setPage(0); }}>
          <option value="ALL">All roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </SelectField>
        <Button type="button" variant="outline" onClick={() => { setSearch(''); setRole('ALL'); setPage(0); }}>Clear filters</Button>
      </FilterBar>

      {(search || role !== 'ALL') && (
        <div className="flex flex-wrap gap-2">
          {search && <Chip onRemove={() => { setSearch(''); setPage(0); }}>Search: {search}</Chip>}
          {role !== 'ALL' && <Chip tone="green" onRemove={() => { setRole('ALL'); setPage(0); }}>Role: {role}</Chip>}
        </div>
      )}

      {error && !loading && <ErrorState message={error} retry={load} />}
      {loading ? <LoadingState /> : !error && filteredItems.length === 0 ? <EmptyState title="No users found" description="No account matches the current filters." /> : (
        <>
          <div className="motion-stagger hidden gap-3 md:grid" aria-live="polite">
            {filteredItems.map((user) => (
              <article key={user.userId} className="admin-card grid min-w-0 gap-4 p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_auto_minmax(0,1fr)_minmax(8rem,0.75fr)_auto] xl:items-center">
                <UserIdentity user={user} />
                <ContactBlock user={user} />
                <RoleBadge user={user} />
                <div className="flex min-w-0 flex-wrap gap-2"><VerificationGroup user={user} /></div>
                <InfoMeta label="Joined" value={user.createdAt ? formatDate(user.createdAt) : 'Not recorded'} />
                <UserActions user={user} onView={setSelected} onDelete={setDeleteTarget} />
              </article>
            ))}
          </div>

          <div className="motion-stagger grid gap-3 md:hidden" aria-live="polite">
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

function UserActions({ user, onView, onDelete }: { user: User; onView: (user: User) => void; onDelete: (user: User) => void }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2 xl:justify-end">
      <Button type="button" variant="outline" size="sm" className="flex-1 xl:flex-none" onClick={() => onView(user)}><Eye size={16} /> View</Button>
      <Button type="button" variant="destructive" size="sm" className="flex-1 xl:flex-none" onClick={() => onDelete(user)}><Trash2 size={16} /> Delete</Button>
    </div>
  );
}

function InfoMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-600">{value}</p>
    </div>
  );
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-sm font-bold text-green-700">
        {initials(user.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold text-slate-900">{user.name}</p>
        <p className="text-xs font-bold text-slate-500">ID {user.userId}</p>
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
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${admin ? 'bg-slate-950 text-white ring-slate-900' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
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
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${verified ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
      {verified ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  );
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}
