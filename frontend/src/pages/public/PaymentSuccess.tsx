import { AlertTriangle, CheckCircle2, Clock, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentApi } from '../../api/modules';
import { LoadingState } from '../../components/State';
import { takePendingTransaction } from '../../utils/gatewayCheckout';

type Outcome = 'verifying' | 'success' | 'pending' | 'failed';

/**
 * Landing page for the gateway redirect.
 *
 * <p>This page used to read a `status` query parameter and simply announce success, without ever
 * contacting the backend - so anyone could visit /payment/success?status=Complete and be told
 * their booking was confirmed. The redirect is now treated as untrusted: the identifiers are
 * handed to the server, which verifies them against eSewa's status API or Khalti's lookup API
 * before confirming anything.
 */
export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [outcome, setOutcome] = useState<Outcome>('verifying');
  const [message, setMessage] = useState('');
  const verifyStarted = useRef(false);

  useEffect(() => {
    // React 18 StrictMode double-invokes effects in development; verification is idempotent
    // server-side, but there is no reason to fire it twice.
    if (verifyStarted.current) return;
    verifyStarted.current = true;

    // eSewa appends a base64 JSON blob as `data`; Khalti appends `pidx`.
    const data = searchParams.get('data');
    const pidx = searchParams.get('pidx');

    if (!data && !pidx) {
      setOutcome('failed');
      setMessage('This page was opened without a payment reference, so there is nothing to confirm.');
      return;
    }

    paymentApi
      .verify({ data: data ?? undefined, pidx: pidx ?? undefined })
      .then((result) => {
        if (result.status === 'COMPLETED') {
          takePendingTransaction(); // settled; nothing left to release
          setOutcome('success');
          setMessage(result.message || 'Payment confirmed. Your booking is awaiting venue approval.');
          return;
        }
        if (result.status === 'PENDING') {
          setOutcome('pending');
          setMessage(result.message || 'The gateway is still processing this payment.');
          return;
        }
        setOutcome('failed');
        setMessage(result.message || 'The payment could not be confirmed.');
      })
      .catch((err: unknown) => {
        setOutcome('failed');
        setMessage(err instanceof Error ? err.message : 'The payment could not be confirmed.');
      });
  }, [searchParams]);

  if (outcome === 'verifying') {
    return (
      <main className="container-page py-10">
        <LoadingState label="Confirming your payment with the gateway..." />
      </main>
    );
  }

  const view = {
    success: {
      icon: <CheckCircle2 size={32} />,
      tone: 'bg-green-50 text-green-600',
      title: 'Payment successful'
    },
    pending: {
      icon: <Clock size={32} />,
      tone: 'bg-amber-50 text-amber-600',
      title: 'Payment pending'
    },
    failed: {
      icon: <AlertTriangle size={32} />,
      tone: 'bg-red-50 text-red-600',
      title: 'Payment not confirmed'
    }
  }[outcome];

  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-md">
        <div className="panel p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${view.tone}`}>
              {view.icon}
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-black text-slate-950">{view.title}</h1>
          <p className="mb-6 text-slate-600">{message}</p>
          <div className="space-y-3">
            <Link to="/my-bookings" className="btn-primary block w-full">
              View My Bookings
            </Link>
            <Link to="/venues" className="btn-soft block w-full">
              <Home size={18} className="inline" />
              {' '}Back to Venues
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
