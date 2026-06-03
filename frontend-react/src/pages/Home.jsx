import { NavLink } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">Venue discovery and slot booking</div>
            <h1>
              Book futsal<br />
              <span className="accent">courts faster</span>
            </h1>
            <p>Search nearby venues, compare available time slots, pay securely, and manage every booking from one clean workspace.</p>
            <div className="hero-cta">
              <NavLink to="/futsals" className="btn btn-primary btn-lg">Explore Venues</NavLink>
              <NavLink to="/register" className="btn btn-secondary btn-lg">Create Account</NavLink>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">Live</div>
                <div className="hero-stat-label">Availability</div>
              </div>
              <div>
                <div className="hero-stat-num">Fast</div>
                <div className="hero-stat-label">Payment Flow</div>
              </div>
              <div>
                <div className="hero-stat-num">Admin</div>
                <div className="hero-stat-label">Operations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-eyebrow">Why FutsalBook</div>
          <div className="section-title">Everything teams and venues need</div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">01</div>
              <h3>Real-time availability</h3>
              <p>See exactly which slots are open right now. No guessing, no double-bookings.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">02</div>
              <h3>Fast booking flow</h3>
              <p>Book your preferred time slot in seconds. Get status updates as admin reviews.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">03</div>
              <h3>Booking history</h3>
              <p>Track all your past and upcoming bookings in one organized view.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">04</div>
              <h3>Simple cancellations</h3>
              <p>Need to cancel? Do it yourself from your bookings dashboard - no calls needed.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">05</div>
              <h3>Secure accounts</h3>
              <p>Your data is protected with hashed passwords and secure login.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">06</div>
              <h3>Admin control</h3>
              <p>Venue managers can manage slots, approve bookings, and track everything.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready for kickoff?</h2>
          <p>Create your account and book your first slot today.</p>
          <div className="actions-row flex-center">
            <NavLink to="/register" className="btn btn-primary btn-lg">Get Started Free</NavLink>
            <NavLink to="/login" className="btn btn-secondary btn-lg">Already have an account?</NavLink>
          </div>
        </div>
      </section>

      <footer>
        <span>FutsalBook</span> - Sports venue booking and operations platform
      </footer>
    </>
  );
}
