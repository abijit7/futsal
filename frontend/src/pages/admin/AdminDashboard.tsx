import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, MapPin, Plus, RefreshCw, Users, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingApi, futsalApi, userApi } from '../../api/modules';
import { ErrorState } from '../../components/State';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/UI';
import type { Booking } from '../../types/api';
import { formatDate, timeRangeWithDuration, todayInput } from '../../utils/format';

type Stats = {
  venues: number;
  pending: number;
  today: number;
  users: number;
};

const quickActions = [
  { title: 'Venues', text: 'Create, edit, and publish venue listings.', href: '/admin/futsals', icon: MapPin },
  { title: 'Slots', text: 'Add slots or bulk-generate schedules.', href: '/admin/slots', icon: CalendarDays },
  { title: 'Bookings', text: 'Approve, reject, or cancel requests.', href: '/admin/bookings', icon: Clock3 },
  { title: 'Users', text: 'Review accounts and verification.', href: '/admin/users', icon: Users }
];

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingList, setPendingList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // size:1 because only the totalItems count is needed; the pending list is fetched once.
      const [venues, pending, today, users, pendingPage] = await Promise.all([
        futsalApi.list({ page: 0, size: 1 }),
        bookingApi.all({ page: 0, size: 1, status: 'PENDING' }),
        bookingApi.all({ page: 0, size: 1, slotDate: todayInput() }),
        userApi.list({ page: 0, size: 1 }),
        bookingApi.all({ page: 0, size: 5, status: 'PENDING' })
      ]);
      setStats({
        venues: venues.totalItems ?? 0,
        pending: pending.totalItems ?? 0,
        today: today.totalItems ?? 0,
        users: users.totalItems ?? 0
      });
      setPendingList(pendingPage.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Overview</h2>
          <p className="mt-0.5 text-sm text-slate-500">Live counts from the booking backend.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {error && <ErrorState message={error} retry={load} />}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Pending bookings" value={stats?.pending} loading={loading} icon={<Clock3 size={18} />} tone="amber" to="/admin/bookings" />
        <Stat label="Bookings today" value={stats?.today} loading={loading} icon={<CalendarDays size={18} />} tone="green" to="/admin/bookings" />
        <Stat label="Venues" value={stats?.venues} loading={loading} icon={<MapPin size={18} />} tone="slate" to="/admin/futsals" />
        <Stat label="Registered users" value={stats?.users} loading={loading} icon={<Users size={18} />} tone="slate" to="/admin/users" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h3 className="font-bold text-slate-900">Awaiting approval</h3>
              <p className="mt-0.5 text-sm text-slate-500">Oldest pending requests first.</p>
            </div>
            <Link to="/admin/bookings" className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-sm font-bold text-green-700 hover:text-green-800">
              View all <ArrowRight size={15} />
            </Link>
          </header>

          {loading ? (
            <ul className="divide-y divide-slate-200">
              {[0, 1, 2].map((row) => (
                <li key={row} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                </li>
              ))}
            </ul>
          ) : pendingList.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
              Nothing waiting. Every booking has been reviewed.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {pendingList.map((booking) => (
                <li key={booking.bookingId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Clock3 size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {booking.timeSlot?.futsal?.name || 'Venue unavailable'}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {booking.user?.name || 'Unknown user'} · {formatDate(booking.timeSlot?.slotDate)} · {timeRangeWithDuration(booking.timeSlot?.startTime, booking.timeSlot?.endTime)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <header className="border-b border-slate-200 px-4 py-3">
            <h3 className="font-bold text-slate-900">Quick actions</h3>
            <p className="mt-0.5 text-sm text-slate-500">Jump straight into a workflow.</p>
          </header>
          <ul className="divide-y divide-slate-200">
            {quickActions.map(({ title, text, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  to={href}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{title}</span>
                    <span className="block truncate text-xs font-semibold text-slate-500">{text}</span>
                  </span>
                  <ArrowRight size={15} className="shrink-0 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 border-t border-slate-200 p-3 sm:grid-cols-2">
            <Link to="/admin/futsals" className="btn-primary min-h-10 rounded-xl px-3 py-2 text-sm">
              <Plus size={16} /> Add venue
            </Link>
            <Link to="/admin/slots" className="btn-soft min-h-10 rounded-xl px-3 py-2 text-sm">
              <Wand2 size={16} /> Generate slots
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}

const statTones: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700',
  green: 'bg-green-50 text-green-700',
  slate: 'bg-slate-100 text-slate-600'
};

function Stat({
  label,
  value,
  loading,
  icon,
  tone,
  to
}: {
  label: string;
  value?: number;
  loading: boolean;
  icon: React.ReactNode;
  tone: keyof typeof statTones | string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-green-300 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-green-100 sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${statTones[tone] || statTones.slate}`}>
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-14 animate-pulse rounded bg-slate-100 sm:mt-3 sm:h-8" />
      ) : (
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:mt-2 sm:text-3xl">{value ?? '—'}</p>
      )}
    </Link>
  );
}
