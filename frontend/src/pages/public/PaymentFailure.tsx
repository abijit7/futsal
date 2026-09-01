import { AlertCircle, Home } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { paymentApi } from '../../api/modules';
import { takePendingTransaction } from '../../utils/gatewayCheckout';

/**
 * Landing page for an abandoned or rejected gateway payment.
 *
 * <p>Releases the slot hold straight away rather than waiting for the server-side sweep, so the
 * slot goes back on sale for other users within seconds instead of up to an hour.
 */
export function PaymentFailure() {
  const [released, setReleased] = useState<boolean | null>(null);
  const cancelStarted = useRef(false);

  useEffect(() => {
    if (cancelStarted.current) return;
    cancelStarted.current = true;

    const transactionId = takePendingTransaction();
    if (!transactionId) {
      setReleased(null);
      return;
    }

    paymentApi
      .cancel(transactionId)
      .then(() => setReleased(true))
      // The scheduled sweep is the backstop, so a failure here is not worth alarming the user
      // about - it only means the slot stays held a little longer.
      .catch(() => setReleased(false));
  }, []);

  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-md">
        <div className="panel p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle size={32} />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-black text-slate-950">Payment Failed</h1>
          <p className="mb-6 text-slate-600">
            Your payment could not be processed. This may be due to insufficient funds, network issues, or the payment was cancelled.
          </p>
          {released === true && (
            <p className="mb-6 rounded-2xl bg-slate-100 p-3 text-sm font-bold text-slate-600">
              The time slot has been released and is available to book again.
            </p>
          )}
          <div className="space-y-3">
            <Link to="/venues" className="btn-primary block w-full">
              <Home size={18} className="inline" />
              {' '}Back to Venues
            </Link>
            <Link to="/my-bookings" className="btn-soft block w-full">
              View My Bookings
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            If you believe this is an error, please try again or contact support.
          </p>
        </div>
      </div>
    </main>
  );
}
