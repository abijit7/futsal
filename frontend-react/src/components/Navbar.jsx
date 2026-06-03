import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Auth } from '../utils/auth.js';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(Auth.get());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleChange = () => setUser(Auth.get());
    window.addEventListener('storage', handleChange);
    window.addEventListener('authchange', handleChange);
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('authchange', handleChange);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const logout = () => {
    Auth.logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <span className="logo-mark" aria-hidden="true">
            <span></span>
          </span>
          <span>Futsal<span>Book</span></span>
        </NavLink>

        <button
          type="button"
          className={`nav-toggle ${open ? 'open' : ''}`}
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links ${open ? 'show' : ''}`}>
          {user ? (
            user.role === 'ADMIN' ? (
              <>
                <NavLink to="/admin" className="nav-link">Dashboard</NavLink>
                <NavLink to="/admin/futsals" className="nav-link">Futsals</NavLink>
                <NavLink to="/admin/slots" className="nav-link">Slots</NavLink>
                <NavLink to="/admin/bookings" className="nav-link">Bookings</NavLink>
                <NavLink to="/admin/users" className="nav-link">Users</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                <NavLink to="/futsals" className="nav-link">Futsals</NavLink>
                <NavLink to="/slots" className="nav-link">Book a Slot</NavLink>
                <NavLink to="/my-bookings" className="nav-link">My Bookings</NavLink>
              </>
            )
          ) : (
            <>
              <NavLink to="/login" className="nav-link">Login</NavLink>
              <NavLink to="/register" className="nav-btn">Register</NavLink>
            </>
          )}

          {user && (
            <div className="nav-user">
              <div className="nav-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
              <span className="nav-user-name">{user.name?.split(' ')[0]}</span>
              <button onClick={logout} className="btn btn-secondary btn-sm">Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
