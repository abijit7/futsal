import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminRefunds } from './AdminRefunds';

const outstanding = vi.fn();
const confirm = vi.fn();

vi.mock('../../api/modules', () => ({
  refundApi: {
    outstanding: (page: number, size: number) => outstanding(page, size),
    confirm: (id: number, reference?: string) => confirm(id, reference)
  }
}));

const refund = {
  transactionId: 901,
  bookingId: 55,
  amount: 1200,
  currency: 'NPR',
  customerName: 'Ram Thapa',
  customerEmail: 'ram@example.com',
  venueName: 'Futsal Arena',
  gatewayReference: 'ESW-REF-9931',
  reason: 'Booking cancelled',
  requestedBy: 'admin',
  refundDueAt: '2026-06-20T08:00:00',
  outstandingHours: 2
};

const page = (items: unknown[]) => ({ items, page: 0, size: 20, totalItems: items.length, totalPages: 1 });

describe('AdminRefunds', () => {
  beforeEach(() => {
    outstanding.mockReset();
    confirm.mockReset();
    confirm.mockResolvedValue({});
  });

  it('lists what is owed, to whom, and the reference needed to pay it', async () => {
    outstanding.mockResolvedValue(page([refund]));
    render(<AdminRefunds />);

    // The page renders a desktop table and a mobile card stack, with CSS hiding one, so queries
    // are scoped to the table to avoid matching both copies.
    const table = within(await screen.findByRole('table'));
    expect(table.getByText('Ram Thapa')).toBeInTheDocument();
    // The gateway reference is the whole point of the page: it is what the operator pastes into
    // the eSewa dashboard, because the system cannot issue the refund itself.
    expect(table.getByText('ESW-REF-9931')).toBeInTheDocument();
    expect(table.getByText('Futsal Arena')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is owed', async () => {
    outstanding.mockResolvedValue(page([]));
    render(<AdminRefunds />);

    expect(await screen.findByText('No refunds owed')).toBeInTheDocument();
  });

  it('surfaces a load failure instead of rendering an empty queue', async () => {
    outstanding.mockRejectedValue(new Error('Backend unreachable'));
    render(<AdminRefunds />);

    expect(await screen.findByText('Backend unreachable')).toBeInTheDocument();
    expect(screen.queryByText('No refunds owed')).not.toBeInTheDocument();
  });

  /** Manual confirmation is deliberately behind a dialog: it asserts money has actually moved. */
  it('confirms a refund only after the dialog is accepted', async () => {
    outstanding.mockResolvedValue(page([refund]));
    render(<AdminRefunds />);

    const table = within(await screen.findByRole('table'));
    await userEvent.click(table.getByRole('button', { name: /mark refunded/i }));
    expect(screen.getByText(/Mark this refund as issued\?/i)).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /mark refunded/i }));

    expect(confirm).toHaveBeenCalledWith(901, undefined);
  });
});
