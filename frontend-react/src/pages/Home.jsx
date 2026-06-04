import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FutsalAPI } from '../api/futsal.js';
import { FutsalStore } from '../utils/futsalStore.js';
import { formatTime } from '../utils/format.js';
import { resolveImageUrl } from '../utils/image.js';

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const data = await FutsalAPI.getAll({ page: 0, size: 4 });
        setFeatured(data?.items ?? data ?? []);
      } catch {
        setFeatured([]);
      }
    };
    loadFeatured();
  }, []);

  const selectFutsal = (futsal) => {
    FutsalStore.save({ futsalId: futsal.futsalId, name: futsal.name });
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">Live futsal booking platform</div>
            <h1>
              Find your next<br />
              <span className="accent">futsal court</span>
            </h1>
            <p>Browse futsal venues, compare available slots, reserve your session, and manage every booking from one professional dashboard.</p>
            <div className="hero-cta">
              <NavLink to="/futsals" className="btn btn-primary btn-lg">Explore Venues</NavLink>
              <NavLink to="/slots" className="btn btn-secondary btn-lg">View Slots</NavLink>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">{featured.length || 'Live'}</div>
                <div className="hero-stat-label">Listed Venues</div>
              </div>
              <div>
                <div className="hero-stat-num">NPR</div>
                <div className="hero-stat-label">Local Pricing</div>
              </div>
              <div>
                <div className="hero-stat-num">Real</div>
                <div className="hero-stat-label">Availability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="venue-strip-section">
        <div className="container">
          <div className="section-row">
            <div>
              <div className="section-eyebrow">Featured futsals</div>
              <div className="section-title">Book from active venues</div>
            </div>
            <NavLink to="/futsals" className="btn btn-secondary">View All</NavLink>
          </div>
          {featured.length > 0 ? (
            <div className="featured-venues-grid">
              {featured.map((futsal) => {
                const image = (futsal.imageUrls && futsal.imageUrls[0]) || futsal.imageUrl;
                return (
                  <NavLink
                    to="/slots"
                    key={futsal.futsalId}
                    className="featured-venue-card"
                    onClick={() => selectFutsal(futsal)}
                  >
                    {image ? (
                      <img src={resolveImageUrl(image)} alt={futsal.name} onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      <div className="venue-placeholder compact"><span>{futsal.name?.charAt(0)?.toUpperCase() || 'F'}</span></div>
                    )}
                    <div className="featured-venue-info">
                      <span className="availability-pill">Available slots</span>
                      <h3>{futsal.name}</h3>
                      <p>{futsal.address}, {futsal.city}</p>
                      <div className="venue-card-footer">
                        <span>Opens {futsal.openingTime ? formatTime(futsal.openingTime) : '-'}</span>
                        <strong>NPR {futsal.hourlyPrice ?? '-'} / hr</strong>
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><div className="icon">F</div><h3>Venues will appear here</h3><p>Add futsals from the admin panel to populate this section.</p></div>
          )}
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-eyebrow">How it works</div>
          <div className="section-title">A simple booking flow</div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">01</div>
              <h3>Pick a venue</h3>
              <p>Search futsals by city, price, images, opening time, and venue details.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">02</div>
              <h3>Select a slot</h3>
              <p>Use real backend availability to choose the session that fits your team.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">03</div>
              <h3>Pay and confirm</h3>
              <p>Choose eSewa, Khalti, or cash and submit the booking for approval.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">04</div>
              <h3>Manage bookings</h3>
              <p>Track pending, approved, rejected, and cancelled bookings from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready for kickoff?</h2>
          <p>Browse available venues and reserve your next futsal session.</p>
          <div className="actions-row flex-center">
            <NavLink to="/futsals" className="btn btn-primary btn-lg">Explore Futsals</NavLink>
            <NavLink to="/login" className="btn btn-secondary btn-lg">Sign In</NavLink>
          </div>
        </div>
      </section>

      <footer>
        <span>FutsalGo</span> - Sports venue booking and operations platform
      </footer>
    </>
  );
}
