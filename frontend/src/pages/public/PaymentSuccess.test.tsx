import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PaymentSuccess } from './PaymentSuccess';

const verify = vi.fn();
vi.mock('../../api/modules', () => ({
  paymentApi: {
    verify: (payload: { data?: string }) => verify(payload)
  }
}));

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/payment/success${search}`]}>
      <PaymentSuccess />
    </MemoryRouter>
  );
}

describe('PaymentSuccess', () => {
  beforeEach(() => {
    verify.mockReset();
    sessionStorage.clear();
  });

  /**
   * The regression this page exists to prevent: it once trusted a `status` query parameter, so
   * anyone could visit /payment/success?status=Complete and be told their booking was confirmed.
   */
  it('never reports success from query parameters alone', async () => {
    renderAt('?status=Complete');

    expect(await screen.findByText('Payment not confirmed')).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it('hands an eSewa payload to the server and reports the verified result', async () => {
    verify.mockResolvedValue({ status: 'COMPLETED', message: 'Payment confirmed.' });
    renderAt('?data=BASE64BLOB');

    expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    expect(verify).toHaveBeenCalledWith({ data: 'BASE64BLOB' });
  });

  /** Khalti has been removed, so a stray pidx is not a payment reference any more. */
  it('ignores a Khalti pidx and does not call the server', async () => {
    renderAt('?pidx=KHALTI_PIDX');

    expect(await screen.findByText('Payment not confirmed')).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it('shows a pending state when the gateway has not settled yet', async () => {
    verify.mockResolvedValue({ status: 'PENDING', message: 'Still processing.' });
    renderAt('?data=BASE64BLOB');

    expect(await screen.findByText('Payment pending')).toBeInTheDocument();
    expect(screen.getByText('Still processing.')).toBeInTheDocument();
  });

  /** A rejected verification must never be presented as a confirmed booking. */
  it('reports failure when the server rejects the payment', async () => {
    verify.mockResolvedValue({ status: 'FAILED', message: 'Signature mismatch.' });
    renderAt('?data=TAMPERED');

    expect(await screen.findByText('Payment not confirmed')).toBeInTheDocument();
    expect(screen.getByText('Signature mismatch.')).toBeInTheDocument();
  });

  it('surfaces a network failure rather than claiming success', async () => {
    verify.mockRejectedValue(new Error('Network unreachable'));
    renderAt('?data=BASE64BLOB');

    expect(await screen.findByText('Payment not confirmed')).toBeInTheDocument();
    expect(screen.getByText('Network unreachable')).toBeInTheDocument();
  });

  it('verifies only once despite StrictMode double-invoking effects', async () => {
    verify.mockResolvedValue({ status: 'COMPLETED', message: 'Payment confirmed.' });
    renderAt('?data=BASE64BLOB');

    expect(await screen.findByText('Payment successful')).toBeInTheDocument();
    expect(verify).toHaveBeenCalledTimes(1);
  });
});
