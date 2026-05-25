import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Auth } from '../utils/auth.js';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(Auth.get());

  useEffect(() => {
    const handleChange = () => setUser(Auth.get());
    window.addEventListener('storage', handleChange);
    window.addEventListener('authchange', handleChange);
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('authchange', handleChange);
    };
  }, []);

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
          <div className="logo-icon">⚽</div>
          Futsal<span>Book</span>
        </NavLink>

        <div className="navbar-links">
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
              <span>{user.name?.split(' ')[0]}</span>
              <button onClick={logout} className="nav-link btn-secondary btn-sm">Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

