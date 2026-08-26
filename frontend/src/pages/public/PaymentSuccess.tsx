import { CheckCircle2, Home, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { bookingApi } from '../../api/modules';
import { EmptyState, LoadingState } from '../../components/State';
import { Button, PageHero } from '../../components/UI';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState<number | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      const transactionId = searchParams.get('transaction_id');
      const status = searchParams.get('status');
      const gatewayRef = searchParams.get('refId') || searchParams.get('idx');

      if (status === 'Complete' || status === 'Completed') {
        // Payment was successful
        setStatus('success');
        setMessage('Payment completed successfully! Your booking has been confirmed.');
        // In a real implementation, you might want to verify the payment with the backend
        // and get the actual booking ID
      } else {
        setStatus('error');
        setMessage('Payment was not completed successfully.');
      }
    };

    processPayment();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <main className="container-page py-10">
        <LoadingState label="Processing payment confirmation..." />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="container-page py-10">
        <div className="max-w-md mx-auto">
          <div className="panel p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Clock size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-slate-950 mb-2">Payment Processing</h1>
            <p className="text-slate-600 mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link to="/venues" className="btn-primary">
                <Home size={18} />
                Back to Venues
              </Link>
              <Link to="/my-bookings" className="btn-secondary">
                View My Bookings
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-page py-10">
      <div className="max-w-md mx-auto">
        <div className="panel p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-950 mb-2">Payment Successful!</h1>
          <p className="text-slate-600 mb-6">{message}</p>
          <div className="space-y-3">
            <Link to="/my-bookings" className="btn-primary w-full">
              View My Bookings
            </Link>
            <Link to="/venues" className="btn-secondary w-full">
              <Home size={18} />
              Back to Venues
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
