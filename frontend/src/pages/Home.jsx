import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtNpr, fmtDate } from '../api';
import { gradFor } from '../art';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/events?size=12', { auth: false })
      .then(p => setEvents(p.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="hero">
        <span className="kicker">Nepal's event ticketing</span>
        <h1>Find your next <em>night out.</em></h1>
        <p>Concerts, summits and shows across Nepal — pay with eSewa, walk in with a QR code. No paper, no queues.</p>
        <div className="cta-row">
          <Link to="/register" className="btn">Get tickets</Link>
          <Link to="/organizer" className="btn ghost">Sell tickets for your event</Link>
        </div>
        <div className="stats">
          <div><b>{events.length}+</b><span>Live events</span></div>
          <div><b>eSewa</b><span>Secure payments</span></div>
          <div><b>QR</b><span>Gate check-in</span></div>
        </div>
      </div>

      <h2 className="section-title">On sale now</h2>
      {loading ? <p className="muted">Loading events…</p> :
        events.length === 0 ? <p className="muted">No events on sale right now. Check back soon.</p> :
        <div className="grid">
          {events.map(e => (
            <Link key={e.id} to={`/events/${e.id}`} className="event-card">
              <div className="event-banner" style={{ background: gradFor(e.id) }}>
                <span className="date-chip">{fmtDate(e.startsAt).split(',')[0]}</span>
              </div>
              <div className="event-body">
                <h3>{e.title}</h3>
                <p className="meta">{e.venue} · {e.city}</p>
                <p className="meta">{fmtDate(e.startsAt)}</p>
                <div className="event-foot">
                  <span className="from">From {fmtNpr(Math.min(...e.tiers.map(t => t.priceNpr)))}</span>
                  <span className="arrow">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>}
    </>
  );
}
