import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Register } from './Register';

const register = vi.fn();
const navigate = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ register })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const renderRegister = () => render(<MemoryRouter><Register /></MemoryRouter>);

const fill = async (overrides: Partial<Record<'name' | 'phone' | 'email' | 'password', string>> = {}) => {
  const values = {
    name: 'Bibek Shrestha',
    phone: '9800000009',
    email: 'bibek@gmail.com',
    password: 'Futsal7Pitch',
    ...overrides
  };
  await userEvent.type(screen.getByLabelText(/full name/i), values.name);
  await userEvent.type(screen.getByLabelText(/phone/i), values.phone);
  await userEvent.type(screen.getByLabelText(/email/i), values.email);
  await userEvent.type(screen.getByLabelText(/^password/i), values.password);
  return values;
};

describe('Register', () => {
  beforeEach(() => {
    register.mockReset();
    navigate.mockReset();
  });

  it('creates the account and sends the visitor to sign in', async () => {
    register.mockResolvedValue(undefined);
    renderRegister();
    const values = await fill();

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(register).toHaveBeenCalledWith(values);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login', expect.objectContaining({ replace: true })));
  });

  /** example.com is reserved and undeliverable, so the verification email could never arrive. */
  it('refuses a reserved test domain and never calls the API', async () => {
    renderRegister();
    await fill({ email: 'bibek@example.com' });

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText(/example\.com is a reserved test domain/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('refuses a disposable address', async () => {
    renderRegister();
    await fill({ email: 'bibek@mailinator.com' });

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText(/disposable email addresses/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  /** The reported case: eight characters used to be the only bar. */
  it('refuses 12345678 and says why', async () => {
    renderRegister();
    await fill({ password: '12345678' });

    await userEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(await screen.findByText(/that's a sequence, not a password/i)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('strips non-digits from the phone number as it is typed', async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/phone/i), '98-00 00 00 09');

    expect(screen.getByLabelText(/phone/i)).toHaveValue('9800000009');
  });

  it('waits for a blur before flagging a field the visitor is still filling in', async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/email/i), 'bi');

    expect(screen.queryByText(/enter a valid email address/i)).not.toBeInTheDocument();

    await userEvent.tab();

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });
});
