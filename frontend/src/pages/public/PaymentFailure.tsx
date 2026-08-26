import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, PageHero } from '../../components/UI';

export function PaymentFailure() {
  return (
    <main className="container-page py-10">
      <div className="max-w-md mx-auto">
        <div className="panel p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mb-2">Payment Failed</h1>
          <p className="text-slate-600 mb-6">
            Your payment could not be processed. This may be due to insufficient funds, network issues, or the payment was cancelled.
          </p>
          <div className="space-y-3">
            <Link to="/venues" className="btn-primary w-full">
              <Home size={18} />
              Back to Venues
            </Link>
            <Link to="/my-bookings" className="btn-secondary w-full">
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
