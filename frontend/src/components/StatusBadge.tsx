import type { BookingStatus } from '../types/api';

type StatusValue = BookingStatus | 'AVAILABLE' | 'UNAVAILABLE' | 'ACTIVE' | 'INACTIVE';

const styles: Record<StatusValue, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-green-50 text-green-700 ring-green-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
  AVAILABLE: 'bg-green-50 text-green-700 ring-green-200',
  UNAVAILABLE: 'bg-slate-100 text-slate-600 ring-slate-200',
  ACTIVE: 'bg-green-50 text-green-700 ring-green-200',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-200'
};

const fallbackStyle = 'bg-slate-100 text-slate-600 ring-slate-200';

export function StatusBadge({ status, label }: { status: StatusValue; label?: string }) {
  // A status the backend adds later must still render as a badge, not as `undefined`.
  const tone = styles[status] || fallbackStyle;
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${tone}`}>{label || status}</span>;
}
