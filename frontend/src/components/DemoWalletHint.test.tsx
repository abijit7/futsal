import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DemoWalletHint } from './DemoWalletHint';
import { resetDemoInfoCache } from '../hooks/useDemoInfo';

const info = vi.fn();

vi.mock('../api/modules', () => ({
  demoApi: { info: () => info() }
}));

const wallet = { esewaId: '9806800001', esewaPassword: 'Nepal@123', mpin: '1122', otp: '123456' };

describe('DemoWalletHint', () => {
  beforeEach(() => {
    info.mockReset();
    resetDemoInfoCache();
  });

  it('shows the sandbox wallet a visitor needs at checkout', async () => {
    info.mockResolvedValue({ enabled: true, accounts: [], payment: wallet });
    render(<DemoWalletHint />);

    expect(await screen.findByText('9806800001')).toBeInTheDocument();
    expect(screen.getByText('Nepal@123')).toBeInTheDocument();
    expect(screen.getByText('1122')).toBeInTheDocument();
  });

  /**
   * The backend nulls `payment` when checkout points at the live gateway. Showing test wallet
   * numbers there would send the visitor to a login that cannot work.
   */
  it('renders nothing when the gateway is not the sandbox', async () => {
    info.mockResolvedValue({ enabled: true, accounts: [], payment: null });
    const { container } = render(<DemoWalletHint />);

    // waitFor settles the hook's fetch inside act(), so this asserts on the resolved state
    // rather than on the first paint.
    await waitFor(() => expect(info).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when demo mode is off', async () => {
    info.mockResolvedValue({ enabled: false, accounts: [], payment: null });
    const { container } = render(<DemoWalletHint />);

    // waitFor settles the hook's fetch inside act(), so this asserts on the resolved state
    // rather than on the first paint.
    await waitFor(() => expect(info).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
