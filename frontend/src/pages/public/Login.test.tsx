import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';

const login = vi.fn();
const navigate = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const renderLogin = () => render(<MemoryRouter><Login /></MemoryRouter>);

const signInWith = async (email: string, password: string) => {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/password/i), password);
  await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
};

describe('Login', () => {
  beforeEach(() => {
    login.mockReset();
    navigate.mockReset();
  });

  it('renders the sign-in form', () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
  });

  /**
   * The two roles land in different places, and the redirect is the one thing a sign-in page has
   * to get right: an admin sent to the customer dashboard looks like a permissions bug.
   */
  it('sends an admin to the admin area', async () => {
    login.mockResolvedValue({ role: 'ADMIN' });
    renderLogin();

    await signInWith('owner@example.com', 'CorrectHorse1');

    expect(login).toHaveBeenCalledWith('owner@example.com', 'CorrectHorse1');
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/admin', { replace: true }));
  });

  it('sends a player to the customer dashboard', async () => {
    login.mockResolvedValue({ role: 'USER' });
    renderLogin();

    await signInWith('player@example.com', 'CorrectHorse1');

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });

  /** A failure has to stay on the page and say why, rather than navigating anywhere. */
  it('reports a failed sign-in without redirecting', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));
    renderLogin();

    await signInWith('player@example.com', 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(navigate).not.toHaveBeenCalled();
  });
});
