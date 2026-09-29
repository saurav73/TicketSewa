import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtNpr } from '../api';
import EventCard, { dateBadge } from '../components/EventCard';

const CATS = ['All', 'Music', 'Tech', 'Nightlife', 'Comedy', 'Food', 'Arts'];

const STEPS = [
  { n: '01', t: 'Find your event', d: 'Browse concerts, summits, raves and festivals across Nepal — or search for exactly what you are in the mood for.' },
  { n: '02', t: 'Pay with eSewa', d: 'Check out in under a minute with eSewa. Your tickets are issued instantly with a unique QR code each.' },
  { n: '03', t: 'Scan & walk in', d: 'Show the QR at the gate. The organizer scans it once — no paper, no queues, no counterfeit tickets.' }
];

const QUOTES = [
  { q: 'Bought VIP tickets for Himalayan Beats in literally two minutes. The QR check-in at the gate took five seconds.', who: 'Prerana S.', ev: 'Himalayan Beats' },
  { q: 'Sold out our comedy night three days early. The organizer dashboard showed every sale in real time.', who: 'Sagar Events', ev: 'Laugh Lab' },
  { q: 'No more worrying about fake tickets at the door — one scan, one entry. It just works.', who: 'Bibek T.', ev: 'Neon Nights' }
];

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');

  useEffect(() => {
    api('/api/events?size=24', { auth: false })
      .then(p => setEvents(p.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => events.filter(e =>
    (cat === 'All' || e.category === cat) &&
    (!q.trim() || (e.title + ' ' + e.venue + ' ' + e.city + ' ' + (e.tags || []).join(' ')).toLowerCase().includes(q.trim().toLowerCase()))
  ), [events, cat, q]);

  const featured = events.find(e => e.featured) || events[0];
  const fb = featured ? dateBadge(featured.startsAt) : null;
  const fFrom = featured ? Math.min(...featured.tiers.map(t => t.priceNpr)) : 0;

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="hero-xl">
        <img className="hero-bg" src="/img/concert.jpg" alt="Concert crowd at Patan Durbar Square" />
        <div className="hero-shade" />
        <div className="hero-inner">
          <span className="kicker light">Nepal's event ticketing</span>
          <h1>Every great night<br />starts with a <em>ticket.</em></h1>
          <p>Concerts, summits, raves and festivals across Nepal — pay with eSewa, walk in with a QR code.</p>
          <div className="searchbar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search concerts, venues, comedy nights…"
              onKeyDown={e => { if (e.key === 'Enter') document.getElementById('events').scrollIntoView({ behavior: 'smooth' }); }}
            />
            <button className="btn" onClick={() => document.getElementById('events').scrollIntoView({ behavior: 'smooth' })}>Search</button>
          </div>
          <div className="hero-cats">
            {CATS.slice(1).map(c => (
              <button key={c} onClick={() => { setCat(c); setQ(''); document.getElementById('events').scrollIntoView({ behavior: 'smooth' }); }}>{c}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ticker ---------- */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map(k => (
            <span key={k}>
              {events.map(e => <span key={k + '-' + e.id} className="tick">On sale now · {e.title} <i>✦</i></span>)}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- featured ---------- */}
      {featured && (
        <section className="container">
          <div className="sec-head">
            <div><span className="eyebrow">Featured</span><h2>Don't miss this</h2></div>
          </div>
          <Link to={`/events/${featured.id}`} className="spot">
            <div className="spot-media">
              <img src={featured.image} alt={featured.title} />
              <span className="ev-date big"><b>{fb.day}</b><i>{fb.mon}</i></span>
            </div>
            <div className="spot-body">
              <span className="ev-cat">{featured.category}</span>
              <h3>{featured.title}</h3>
              <p className="spot-tag">{featured.tagline}</p>
              <p className="ev-meta">{featured.venue} · {featured.city} · {fb.full}</p>
              <div className="spot-foot">
                <span className="ev-from big">From {fmtNpr(fFrom)}</span>
                <span className="btn">Get tickets →</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ---------- event grid ---------- */}
      <section className="container" id="events">
        <div className="sec-head">
          <div><span className="eyebrow">Browse</span><h2>On sale now</h2></div>
        </div>
        <div className="pills">
          {CATS.map(c => (
            <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        {loading ? <p className="muted">Loading events…</p>
          : filtered.length === 0 ? (
            <div className="empty">
              <h3>No events found</h3>
              <p className="muted">Try a different search or category.</p>
              <button className="btn ghost" onClick={() => { setQ(''); setCat('All'); }}>Clear filters</button>
            </div>
          ) : (
            <div className="ev-grid">{filtered.map(e => <EventCard key={e.id} e={e} />)}</div>
          )}
      </section>

      {/* ---------- how it works ---------- */}
      <section className="band">
        <div className="container">
          <div className="sec-head"><div><span className="eyebrow">How it works</span><h2>From couch to front row</h2></div></div>
          <div className="steps">
            {STEPS.map(s => (
              <div className="step" key={s.n}>
                <span className="step-n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- stats ---------- */}
      <section className="container">
        <div className="stats-band">
          <div><b>28k+</b><span>tickets sold</span></div>
          <div><b>120+</b><span>events hosted</span></div>
          <div><b>15</b><span>cities covered</span></div>
          <div><b>4.9★</b><span>attendee rating</span></div>
        </div>
      </section>

      {/* ---------- testimonials ---------- */}
      <section className="container">
        <div className="sec-head"><div><span className="eyebrow">Loved by</span><h2>Fans & organizers</h2></div></div>
        <div className="quotes">
          {QUOTES.map((t, i) => (
            <figure className="quote" key={i}>
              <blockquote>"{t.q}"</blockquote>
              <figcaption><b>{t.who}</b><span>{t.ev}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- organizer CTA ---------- */}
      <section className="container">
        <div className="cta-org">
          <div>
            <span className="eyebrow">For organizers</span>
            <h2>Hosting something? Sell out, not out of patience.</h2>
            <p>Create your event in minutes, set ticket tiers, and watch sales roll in live. QR check-in included — free for your first event.</p>
            <Link to="/organizer" className="btn gold">Start selling →</Link>
          </div>
          <div className="cta-num"><b>0%</b><span>platform fee on your first event</span></div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="footer2">
        <div className="container f-grid">
          <div className="f-brand">
            <span className="brand">Ticket<span>Sewa</span></span>
            <p>Nepal's event ticketing — concerts, summits and shows, with eSewa payments and QR gate check-in.</p>
          </div>
          <div>
            <h4>Discover</h4>
            <Link to="/">All events</Link>
            {CATS.slice(1, 4).map(c => <a key={c} href="#events" onClick={() => setCat(c)}>{c}</a>)}
          </div>
          <div>
            <h4>Organizers</h4>
            <Link to="/organizer">Sell tickets</Link>
            <Link to="/register">Create account</Link>
            <Link to="/login">Sign in</Link>
          </div>
          <div>
            <h4>Trust</h4>
            <span>eSewa secure payments</span>
            <span>Instant QR tickets</span>
            <span>Verified organizers</span>
          </div>
        </div>
        <div className="f-bottom">© 2026 TicketSewa · Made in Kathmandu</div>
      </footer>
    </>
  );
}
