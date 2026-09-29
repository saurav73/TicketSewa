import { Link } from 'react-router-dom';
import { fmtNpr } from '../api';
import { gradFor } from '../art';

export function dateBadge(iso) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    mon: d.toLocaleString('en-GB', { month: 'short' }),
    full: d.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  };
}

export function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  );
}

export function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
  );
}

export default function EventCard({ e }) {
  const from = Math.min(...e.tiers.map(t => t.priceNpr));
  const b = dateBadge(e.startsAt);
  const soldOut = e.tiers.every(t => t.remaining === 0);
  return (
    <Link to={`/events/${e.id}`} className="ev-card">
      <div className="ev-media">
        {e.image
          ? <img src={e.image} alt={e.title} loading="lazy" />
          : <div className="ev-grad" style={{ background: gradFor(e.id) }} />}
        <span className="ev-date"><b>{b.day}</b><i>{b.mon}</i></span>
        {e.category && <span className="ev-cat">{e.category}</span>}
        {soldOut && <span className="ev-soldout">Sold out</span>}
      </div>
      <div className="ev-body">
        <h3>{e.title}</h3>
        <p className="ev-meta"><PinIcon /> {e.venue} · {e.city}</p>
        <p className="ev-meta"><ClockIcon /> {b.full}</p>
        <div className="ev-foot">
          <span className="ev-from">From {fmtNpr(from)}</span>
          {e.attending > 0 && <span className="ev-going">{e.attending.toLocaleString('en-IN')} going</span>}
        </div>
      </div>
    </Link>
  );
}
