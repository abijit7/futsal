import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AdminRoute, ProtectedRoute } from './ProtectedRoute';

// authToken is passed explicitly rather than defaulted: passing `undefined` to a defaulted
// parameter would silently restore the default and quietly weaken the no-token case below.
function storeUser(role: 'USER' | 'ADMIN', authToken: string | null) {
  localStorage.setItem('futsal_user', JSON.stringify({
    userId: 2, name: 'Ram Thapa', email: 'ram@example.com', phone: '9812345678', role,
    ...(authToken === null ? {} : { authToken })
  }));
}

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/dashboard" element={<p>customer dashboard</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<p>profile page</p>} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>admin console</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('route guards', () => {
  beforeEach(() => localStorage.clear());

  it('sends an anonymous visitor to the login page', () => {
    renderAt('/profile');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('lets a signed-in customer through', () => {
    storeUser('USER', 'token-123');
    renderAt('/profile');
    expect(screen.getByText('profile page')).toBeInTheDocument();
  });

  /** A stored user without a token is not signed in; treating it as such would expose the page. */
  it('treats a stored user with no token as anonymous', () => {
    storeUser('USER', null);
    renderAt('/profile');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('keeps a customer out of the admin console', () => {
    storeUser('USER', 'token-123');
    renderAt('/admin');
    expect(screen.getByText('customer dashboard')).toBeInTheDocument();
    expect(screen.queryByText('admin console')).not.toBeInTheDocument();
  });

  it('lets an admin into the admin console', () => {
    storeUser('ADMIN', 'token-123');
    renderAt('/admin');
    expect(screen.getByText('admin console')).toBeInTheDocument();
  });

  it('sends an anonymous visitor hitting an admin route to login, not the dashboard', () => {
    renderAt('/admin');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
});
