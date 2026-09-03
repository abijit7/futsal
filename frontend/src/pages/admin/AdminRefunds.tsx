import { useEffect, useState } from 'react';
import { Banknote, Check, Copy } from 'lucide-react';
import { refundApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/State';
import { AdminPageHeader, Button, Field, MetricCard, ModalShell } from '../../components/UI';
import type { Refund } from '../../types/api';
import { formatDate, money } from '../../utils/format';

/**
 * The refunds an operator still owes customers.
 *
 * eSewa provides no merchant refund API, so this is a worklist rather than an action queue: the
 * money is returned from the eSewa merchant dashboard using the gateway reference shown here, and
 * a scheduled sweep marks each one refunded once eSewa reports it. The manual confirm button is
 * only for refunds eSewa cannot confirm — cash handed back, or a bank transfer.
 */
export function AdminRefunds() {
  const [items, setItems] = useState<Refund[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<Refund | null>(null);
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await refundApi.outstanding(page, 20);
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : 'Unable to load outstanding refunds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const copyReference = async (refund: Refund) => {
    if (!refund.gatewayReference) return;
    try {
      await navigator.clipboard.writeText(refund.gatewayReference);
      setCopiedId(refund.transactionId);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard access can be refused; the reference is on screen to copy by hand.
    }
  };

  const confirm = async () => {
    if (!confirmTarget) return;
    setSaving(true);
    setError('');
    try {
      await refundApi.confirm(confirmTarget.transactionId, reference.trim() || undefined);
      setConfirmTarget(null);
      setReference('');
      setMessage('Refund recorded. The customer has been emailed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund could not be recorded.');
      setConfirmTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const overdue = items.filter((r) => r.outstandingHours >= 48).length;
  const owed = items.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Payments"
        title="Refunds owed"
        description="Money taken for bookings that were cancelled. Issue each one in the eSewa merchant dashboard; it clears from this list automatically once eSewa confirms it."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Outstanding" value={String(totalItems)} icon={<Banknote size={18} />} />
        <MetricCard label="On this page" value={money(owed)} icon={<Banknote size={18} />} />
        <MetricCard label="Over 48 hours" value={String(overdue)} icon={<Banknote size={18} />} />
      </div>

      {message && (
        <p role="status" className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          {message}
        </p>
      )}

      {loading && <LoadingState label="Loading refunds" />}
      {!loading && error && <ErrorState message={error} retry={load} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No refunds owed"
          description="When a paid booking is cancelled or rejected, the refund appears here with the reference needed to issue it."
        />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {/* Desktop */}
          <div className="admin-card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Venue</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                  <th className="px-4 py-3 font-bold">eSewa reference</th>
                  <th className="px-4 py-3 font-bold">Owed for</th>
                  <th className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((refund) => (
                  <tr key={refund.transactionId}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{refund.customerName || 'Customer'}</div>
                      <div className="text-xs text-slate-500">{refund.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{refund.venueName || '—'}</div>
                      <div className="text-xs text-slate-400">Booking #{refund.bookingId}</div>
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-slate-900">{money(refund.amount)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copyReference(refund)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                        title="Copy reference"
                      >
                        {refund.gatewayReference || '—'}
                        {copiedId === refund.transactionId
                          ? <Check size={13} className="text-green-600" />
                          : <Copy size={13} className="text-slate-400" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={refund.outstandingHours >= 48 ? 'font-bold text-amber-700' : 'text-slate-600'}>
                        {refund.outstandingHours}h
                      </span>
                      <div className="text-xs text-slate-400">{formatDate(refund.refundDueAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setConfirmTarget(refund)}>
                        Mark refunded
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="grid gap-3 md:hidden">
            {items.map((refund) => (
              <div key={refund.transactionId} className="mobile-data-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">{refund.customerName || 'Customer'}</div>
                    <div className="truncate text-xs text-slate-500">{refund.venueName}</div>
                  </div>
                  <div className="shrink-0 text-right font-bold tabular-nums text-slate-900">{money(refund.amount)}</div>
                </div>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">eSewa reference</dt>
                    <dd className="truncate font-mono text-slate-700">{refund.gatewayReference || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Owed for</dt>
                    <dd className={refund.outstandingHours >= 48 ? 'font-bold text-amber-700' : 'text-slate-700'}>
                      {refund.outstandingHours}h
                    </dd>
                  </div>
                </dl>
                <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => setConfirmTarget(refund)}>
                  Mark refunded
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {confirmTarget && (
        <ModalShell
          title="Mark this refund as issued?"
          eyebrow="Confirm refund"
          description={`${money(confirmTarget.amount)} to ${confirmTarget.customerName || 'the customer'}`}
          onClose={() => setConfirmTarget(null)}
          footer={(
            <>
              <Button type="button" variant="outline" disabled={saving} onClick={() => setConfirmTarget(null)}>Cancel</Button>
              <Button type="button" variant="primary" loading={saving} onClick={confirm}>Mark refunded</Button>
            </>
          )}
        >
          <p className="text-sm font-semibold leading-6 text-slate-600">
            Only do this once the money has actually been returned. Refunds issued in the eSewa
            dashboard clear from this list on their own, so this is for refunds eSewa cannot confirm
            — cash handed back, or a bank transfer.
          </p>
          <Field
            label="Reference"
            helper="Optional. A bank transfer id or receipt number, for your records."
            value={reference}
            disabled={saving}
            onChange={(event) => setReference(event.target.value)}
            placeholder="e.g. BANK-TRANSFER-77"
            className="mt-4"
          />
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
            The customer will be emailed to say the refund is complete.
          </p>
        </ModalShell>
      )}
    </div>
  );
}
