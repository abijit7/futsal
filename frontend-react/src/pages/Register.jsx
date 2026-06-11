import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserAPI } from '../api/user.js';
import { Auth } from '../utils/auth.js';

export default function Register() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Auth.isLoggedIn()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');
    setSuccess(false);

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const phone = e.target.phone.value.trim();
    const password = e.target.password.value;
    const confirmPassword = e.target.confirmPassword.value;

    const nameOk = /^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/.test(name) && name.length >= 5 && name.length <= 50;
    if (!nameOk) {
      setAlert('Name must include first and last name (letters only).');
      return;
    }

    const emailOk = /^[A-Za-z0-9._%+-]+@gmail\.com$/.test(email);
    if (!emailOk) {
      setAlert('Email must be a gmail.com address.');
      return;
    }

    const phoneOk = /^(98|97|96)\d{8}$/.test(phone);
    if (!phoneOk) {
      setAlert('Phone must be 10 digits and start with 98, 97, or 96.');
      return;
    }

    if (password !== confirmPassword) {
      setAlert('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await UserAPI.register({ name, email, phone, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setAlert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box auth-box-wide">
        <div className="auth-logo">
          <h1>Futsal<span>Book</span></h1>
          <p>Create your account - it's free</p>
        </div>

        <div className={`alert alert-error ${alert ? 'show' : ''}`}>
          <span>Error</span><span>{alert}</span>
        </div>
        <div className={`alert alert-success ${success ? 'show' : ''}`}>
          <span>Done</span><span>Account created. Redirecting to login...</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="John Doe"
              required
              minLength={5}
              maxLength={50}
              pattern="^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$"
              title="Enter first and last name (letters only)"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@gmail.com"
                required
                pattern="^[A-Za-z0-9._%+-]+@gmail\.com$"
                title="Enter a valid gmail.com address"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                placeholder="98XXXXXXXX"
                required
                inputMode="numeric"
                pattern="^(98|97|96)\d{8}$"
                maxLength={10}
                title="Nepal number: 10 digits starting with 98, 97, or 96"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                placeholder="Repeat password"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">or</div>
        <p className="auth-copy">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
