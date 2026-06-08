import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAPI } from '../api/user.js';
import { Auth } from '../utils/auth.js';
import { useToast } from '../components/ToastProvider.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Auth.isLoggedIn()) {
      navigate(Auth.isAdmin() ? '/admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');
    setLoading(true);

    try {
      const email = e.target.email.value.trim();
      const password = e.target.password.value;
      const user = await UserAPI.login(email, password);
      const role = Auth.tokenRole(user) || user.role;
      Auth.save({ ...user, role });
      showToast(`Welcome back, ${user.name}.`, 'success');
      setTimeout(() => {
        navigate(role === 'ADMIN' ? '/admin' : '/dashboard');
      }, 500);
    } catch (err) {
      setAlert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>Futsal<span>Book</span></h1>
          <p>Sign in to your account</p>
        </div>

        <div className={`alert alert-error ${alert ? 'show' : ''}`}>
          <span>Error</span><span>{alert}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-control" placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-control" placeholder="Password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>
        <p className="auth-copy">
          Don't have an account? <a href="/register">Create one</a>
        </p>
        <p className="auth-note">
          Admin? Use your admin credentials to log in above.
        </p>
      </div>
    </div>
  );
}
