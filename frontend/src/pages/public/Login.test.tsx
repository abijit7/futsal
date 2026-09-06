import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';
import { resetDemoInfoCache } from '../../hooks/useDemoInfo';

const info = vi.fn();
const login = vi.fn();
const navigate = vi.fn();

vi.mock('../../api/modules', () => ({
  demoApi: { info: () => info() }
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const demoInfo = {
  enabled: true,
  accounts: [
    { role: 'ADMIN', label: 'Venue owner', email: 'admin@merofutsal.local', password: 'DemoAdmin123' },
    { role: 'USER', label: 'Player', email: 'player@merofutsal.local', password: 'DemoPlayer123' }
  ],
  payment: null
};

const renderLogin = () => render(<MemoryRouter><Login /></MemoryRouter>);

describe('Login', () => {
  beforeEach(() => {
    info.mockReset();
    login.mockReset();
    navigate.mockReset();
    resetDemoInfoCache();
  });

  it('offers both demo accounts when the deployment is a demo', async () => {
    info.mockResolvedValue(demoInfo);
    renderLogin();

    expect(await screen.findByRole('button', { name: /sign in as venue owner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in as player/i })).toBeInTheDocument();
    // The password is shown deliberately, for anyone who would rather type it.
    expect(screen.getByText('DemoAdmin123')).toBeInTheDocument();
  });

  /** A real deployment must never advertise accounts, so nothing renders on enabled: false. */
  it('hides the demo panel when demo mode is off', async () => {
    info.mockResolvedValue({ enabled: false, accounts: [], payment: null });
    renderLogin();

    await screen.findByRole('button', { name: /^sign in$/i });
    expect(screen.queryByText(/try the demo/i)).not.toBeInTheDocument();
  });

  /** A demo hint is decoration: an unreachable endpoint must not stop anyone signing in. */
  it('still renders the sign-in form when the demo endpoint fails', async () => {
    info.mockRejectedValue(new Error('Backend unreachable'));
    renderLogin();

    expect(await screen.findByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(screen.queryByText(/try the demo/i)).not.toBeInTheDocument();
  });

  it('signs in with the demo credentials and redirects an admin to the admin area', async () => {
    info.mockResolvedValue(demoInfo);
    login.mockResolvedValue({ role: 'ADMIN' });
    renderLogin();

    await userEvent.click(await screen.findByRole('button', { name: /sign in as venue owner/i }));

    expect(login).toHaveBeenCalledWith('admin@merofutsal.local', 'DemoAdmin123');
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin', { replace: true }));
  });

  it('sends a demo player to the customer dashboard', async () => {
    info.mockResolvedValue(demoInfo);
    login.mockResolvedValue({ role: 'USER' });
    renderLogin();

    await userEvent.click(await screen.findByRole('button', { name: /sign in as player/i }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });
});
