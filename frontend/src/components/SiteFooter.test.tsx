import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { POPULAR_CITIES } from '../constants/brand';
import { SiteFooter } from './SiteFooter';

function storeUser(role: 'USER' | 'ADMIN') {
  localStorage.setItem('futsal_user', JSON.stringify({
    userId: 2, name: 'Ram Thapa', email: 'ram@example.com', phone: '9812345678', role,
    authToken: 'token-123'
  }));
}

function renderFooter() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <SiteFooter />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('SiteFooter', () => {
  beforeEach(() => localStorage.clear());

  /**
   * The footer's whole purpose is this link. Venues.tsx treats a `from` with no `date` as today,
   * so the single parameter is what makes it mean "this evening" rather than "any evening".
   */
  it('sends a visitor to courts free this evening', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: /this evening's courts/i }))
      .toHaveAttribute('href', '/venues?from=17:00');
  });

  it('links every city into a venue search', () => {
    renderFooter();

    for (const city of POPULAR_CITIES) {
      expect(screen.getByRole('link', { name: city })).toHaveAttribute('href', `/venues?q=${city}`);
    }
  });

  it('links the legal pages', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  });

  /** Offering "Sign in" to someone already signed in reads as a bug. */
  it('offers account links that match who is signed in', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /my bookings/i })).not.toBeInTheDocument();

    localStorage.clear();
    storeUser('USER');
    renderFooter();
    expect(screen.getAllByRole('link', { name: /my bookings/i }).length).toBeGreaterThan(0);
  });

  it('points an admin at the console rather than the customer dashboard', () => {
    storeUser('ADMIN');
    renderFooter();

    expect(screen.getByRole('link', { name: /admin console/i })).toHaveAttribute('href', '/admin');
  });
});
