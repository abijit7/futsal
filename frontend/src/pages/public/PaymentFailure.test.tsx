import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PaymentFailure } from './PaymentFailure';

const cancel = vi.fn();
vi.mock('../../api/modules', () => ({
  paymentApi: { cancel: (id: string) => cancel(id) }
}));

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/payment/failure${search}`]}>
      <PaymentFailure />
    </MemoryRouter>
  );
}

const encode = (payload: unknown) => btoa(JSON.stringify(payload));

describe('PaymentFailure', () => {
  beforeEach(() => {
    cancel.mockReset();
    cancel.mockResolvedValue({});
    sessionStorage.clear();
  });

  it('reports the status eSewa returned instead of guessing', () => {
    renderAt('?data=' + encode({ status: 'NOT_FOUND', transaction_uuid: 'FUTSAL-1' }));

    expect(screen.getByText(/reported status: NOT_FOUND/)).toBeInTheDocument();
  });

  it('falls back to the generic message when eSewa sends no payload', () => {
    renderAt('');

    expect(screen.getByText(/This may be due to insufficient funds/)).toBeInTheDocument();
  });

  /** A malformed payload must not blank out the page the user landed on. */
  it('falls back rather than throwing on an undecodable payload', () => {
    renderAt('?data=not-valid-base64!!');

    expect(screen.getByText(/This may be due to insufficient funds/)).toBeInTheDocument();
  });

  it('falls back when the payload decodes but carries no status', () => {
    renderAt('?data=' + encode({ transaction_uuid: 'FUTSAL-1' }));

    expect(screen.getByText(/This may be due to insufficient funds/)).toBeInTheDocument();
  });

  /** The hold is released through the server; the query string is never authoritative. */
  it('releases the held slot via the server when a transaction is pending', async () => {
    sessionStorage.setItem('futsal_pending_payment', 'TX-42');
    renderAt('?data=' + encode({ status: 'NOT_FOUND' }));

    expect(await screen.findByText(/released and is available to book again/)).toBeInTheDocument();
    expect(cancel).toHaveBeenCalledWith('TX-42');
  });
});
