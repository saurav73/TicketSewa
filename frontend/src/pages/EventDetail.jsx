import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, sseSubscribe, fmtNpr, fmtDate } from '../api';
import { gradFor } from '../art';
import { useAuth } from '../auth';

export default function EventDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [qty, setQty] = useState({});
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api(`/api/events/${id}`, { auth: false }).then(e => {
      setEvent(e);
      setTiers(e.tiers);
    }).catch(() => setError('Event not found'));

    // Live seat availability via Server-Sent Events (real backend)
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
        body: {
          eventId: Number(id), tierId: tier.id, quantity: q,
          idempotencyKey: crypto.randomUUID() // double-click safe
        }
      });
      nav(`/checkout/${order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBuying(false);
    }
  };

  if (!event) return <p className="muted">{error || 'Loading…'}</p>;

  return (
    <>
      <div className="detail-banner" style={{ background: gradFor(event.id) }}>
        <div className="inner">
          <h1>{event.title}</h1>
          <div className="meta">{event.venue} · {event.city} · {fmtDate(event.startsAt)}</div>
        </div>
      </div>
      <p style={{ maxWidth: 720, color: '#c3ced6', lineHeight: 1.65 }}>{event.description}</p>

      <div className="card mt">
        <h3 style={{ marginTop: 0 }}>
          <span className="live-dot" />Tickets <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· live availability</span>
        </h3>
        {error && <div className="alert error">{error}</div>}
        {tiers.map(t => (
          <div className="tier" key={t.id}>
            <div>
              <div className="name">{t.name}</div>
              <div className={`left ${t.remaining <= 10 ? 'low' : ''}`}>
                {t.remaining === 0 ? 'Sold out' : `${t.remaining} of ${t.quantityTotal} left`}
              </div>
            </div>
            <div className="row">
              <span className="price">{fmtNpr(t.priceNpr)}</span>
              {t.remaining > 0 && (
                <select value={qty[t.id] || 1} onChange={e => setQty({ ...qty, [t.id]: Number(e.target.value) })}>
                  {[...Array(Math.min(10, t.remaining)).keys()].map(i =>
                    <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                </select>
              )}
              <button className="btn" disabled={t.remaining === 0 || buying} onClick={() => buy(t)}>
                {t.remaining === 0 ? 'Sold out' : 'Buy'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
