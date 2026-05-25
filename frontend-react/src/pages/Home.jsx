import { NavLink } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">🏟️ Online Booking Platform</div>
            <h1>
              BOOK YOUR<br />
              <span className="accent">FUTSAL</span>
              <br />SLOT NOW
            </h1>
            <p>Skip the phone calls. Find available slots, book instantly, and get confirmed — all in one place.</p>
            <div className="hero-cta">
              <NavLink to="/futsals" className="btn btn-primary btn-lg">View Futsals →</NavLink>
              <NavLink to="/register" className="btn btn-secondary btn-lg">Create Account</NavLink>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">24/7</div>
                <div className="hero-stat-label">Online Booking</div>
              </div>
              <div>
                <div className="hero-stat-num">100%</div>
                <div className="hero-stat-label">Slot Visibility</div>
              </div>
              <div>
                <div className="hero-stat-num">Fast</div>
                <div className="hero-stat-label">Confirmation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-eyebrow">Why FutsalBook</div>
          <div className="section-title">EVERYTHING YOU NEED</div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🗓️</div>
              <h3>Real-Time Availability</h3>
              <p>See exactly which slots are open right now. No guessing, no double-bookings.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Booking</h3>
              <p>Book your preferred time slot in seconds. Get status updates as admin reviews.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Booking History</h3>
              <p>Track all your past and upcoming bookings in one organized view.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">❌</div>
              <h3>Easy Cancellations</h3>
              <p>Need to cancel? Do it yourself from your bookings dashboard — no calls needed.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Accounts</h3>
              <p>Your data is protected with hashed passwords and secure login.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍💼</div>
              <h3>Admin Control</h3>
              <p>Venue managers can manage slots, approve bookings, and track everything.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>READY TO PLAY?</h2>
          <p>Create your account and book your first slot today.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <NavLink to="/register" className="btn btn-primary btn-lg">Get Started Free</NavLink>
            <NavLink to="/login" className="btn btn-secondary btn-lg">Already have an account?</NavLink>
          </div>
        </div>
      </section>

      <footer>
        <span>FutsalBook</span> — BCA 4th Semester Project | Spring Boot + MySQL + React
      </footer>
    </>
  );
}

