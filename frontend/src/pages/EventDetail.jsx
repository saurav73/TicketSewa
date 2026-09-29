import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, sseSubscribe, fmtNpr } from '../api';
import { gradFor } from '../art';
import { useAuth } from '../auth';
import EventCard, { dateBadge, PinIcon, ClockIcon } from '../components/EventCard';

function Stepper({ value, max, onChange }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0}>−</button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
}

function Faq({ items }) {
  const [open, setOpen] = useState(-1);
  return (
    <div className="faq">
      {items.map((f, i) => (
        <div key={i} className={'faq-item' + (open === i ? ' open' : '')}>
          <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
            {f.q}<span className="faq-x">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && <p className="faq-a">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [qty, setQty] = useState({});
  const [related, setRelated] = useState([]);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api(`/api/events/${id}`, { auth: false }).then(e => {
      setEvent(e);
      setTiers(e.tiers);
    }).catch(() => setError('Event not found'));

    api('/api/events?size=24', { auth: false })
      .then(p => setRelated((p.content || []).filter(e => String(e.id) !== String(id)).slice(0, 3)))
      .catch(() => {});

    return sseSubscribe(id, (msg) => {
      if (Array.isArray(msg)) setTiers(msg);
    });
  }, [id]);

  const buy = async (tier) => {
    setError('');
    if (!user) { nav('/login'); return; }
    const q = qty[tier.id] || 1;
    setBuying(true);
    try {
      const order = await api('/api/orders', {
        method: 'POST',
        body: { eventId: Number(id), tierId: tier.id, quantity: q, idempotencyKey: crypto.randomUUID() }
      });
      nav(`/checkout/${order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBuying(false);
    }
  };

  if (!event) return <p className="muted">{error || 'Loading…'}</p>;

  const b = dateBadge(event.startsAt);
  const paragraphs = (event.description || '').split('\n\n');
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(event.venue + ' ' + event.city);

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="detail-hero bleed">
        {event.image
          ? <img className="detail-bg" src={event.image} alt={event.title} />
          : <div className="detail-bg" style={{ background: gradFor(event.id) }} />}
        <div className="hero-shade" />
        <div className="detail-hero-inner">
          <Link to="/" className="back">← All events</Link>
          <div className="chip-row">
            {event.category && <span className="ev-cat">{event.category}</span>}
            {(event.tags || []).slice(0, 3).map(t => <span key={t} className="chip ghost">{t}</span>)}
          </div>
          <h1>{event.title}</h1>
          {event.tagline && <p className="detail-tagline">{event.tagline}</p>}
          <div className="detail-meta">
            <span><ClockIcon /> {b.full}</span>
            <span><PinIcon /> {event.venue} · {event.city}</span>
            {event.attending > 0 && <span className="ev-going">{event.attending.toLocaleString('en-IN')} going</span>}
          </div>
        </div>
      </section>

      <div className="detail-grid">
        {/* ---------- main column ---------- */}
        <div className="detail-main">
          <section>
            <h2 className="d-h">About this event</h2>
            {paragraphs.map((p, i) => <p key={i} className="d-p">{p}</p>)}
          </section>

          {event.lineup && event.lineup.length > 0 && (
            <section>
              <h2 className="d-h">Lineup</h2>
              <div className="lineup">
                {event.lineup.map((a, i) => (
                  <div className="lineup-row" key={i}>
                    <span className="avatar">{a.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span>
                    <div><b>{a.name}</b><span>{a.role}</span></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {event.schedule && event.schedule.length > 0 && (
            <section>
              <h2 className="d-h">Schedule</h2>
              <div className="timeline">
                {event.schedule.map((s, i) => (
                  <div className="tl-row" key={i}>
                    <span className="tl-time">{s.time}</span>
                    <span className="tl-dot" />
                    <div className="tl-body"><b>{s.title}</b><p>{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="d-h">Venue</h2>
            <div className="venue-card">
              <div>
                <b>{event.venue}</b>
                <p className="muted">{event.venueAddress || event.city}</p>
              </div>
              <a className="btn ghost" href={mapUrl} target="_blank" rel="noopener">Open in Maps →</a>
            </div>
          </section>

          <section>
            <h2 className="d-h">Organized by</h2>
            <div className="org-card">
              <span className="avatar lg">{(event.organizerName || 'O')[0]}</span>
              <div>
                <b>{event.organizerName}</b>
                <p className="muted">{event.organizerAbout || 'Verified organizer on TicketSewa.'}</p>
              </div>
            </div>
          </section>

          {event.faq && event.faq.length > 0 && (
            <section>
              <h2 className="d-h">Good to know</h2>
              <Faq items={event.faq} />
            </section>
          )}
        </div>

        {/* ---------- ticket sidebar ---------- */}
        <aside className="detail-side">
          <div className="ticket-box">
            <h3><span className="live-dot" />Get tickets</h3>
            <p className="muted sm">Live availability · prices in NPR</p>
            {error && <div className="alert error">{error}</div>}
            {tiers.map(t => (
              <div className="tier2" key={t.id}>
                <div className="tier2-top">
                  <div><b>{t.name}</b>
                    <div className={'left' + (t.remaining <= 10 && t.remaining > 0 ? ' low' : '')}>
                      {t.remaining === 0 ? 'Sold out' : `${t.remaining} of ${t.quantityTotal} left`}
                    </div>
                  </div>
                  <span className="price">{fmtNpr(t.priceNpr)}</span>
                </div>
                {t.remaining > 0 && (
                  <div className="tier2-buy">
                    <Stepper value={qty[t.id] || 0} max={Math.min(10, t.remaining)}
                      onChange={v => setQty({ ...qty, [t.id]: v })} />
                    <button className="btn sm" disabled={!(qty[t.id] > 0) || buying}
                      onClick={() => buy(t)}>Buy {(qty[t.id] || 0) > 0 ? `· ${fmtNpr(t.priceNpr * (qty[t.id] || 0))}` : ''}</button>
                  </div>
                )}
              </div>
            ))}
            <ul className="trust">
              <li>✓ Secure payment via eSewa</li>
              <li>✓ Instant QR tickets</li>
              <li>✓ Free cancellation up to 7 days before</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* ---------- related ---------- */}
      {related.length > 0 && (
        <section className="related">
          <h2 className="d-h">You may also like</h2>
          <div className="ev-grid">{related.map(e => <EventCard key={e.id} e={e} />)}</div>
        </section>
      )}
    </>
  );
}
