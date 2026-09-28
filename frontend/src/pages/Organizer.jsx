import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fmtNpr, fmtDate } from '../api';
import { useAuth } from '../auth';

function CheckinBox() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const scan = async (e) => {
    e.preventDefault();
    setError(''); setResult(null);
    try {
      const r = await api('/api/checkin', { method: 'POST', body: { code } });
      setResult(r);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="card mt">
      <h3 style={{ marginTop: 0 }}>Gate check-in</h3>
      <p className="muted">Type or scan a ticket code. A ticket can only be admitted once.</p>
      <form onSubmit={scan} className="row">
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="TS-XXXXXXXX"
          style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', fontSize: 16, textTransform: 'uppercase', width: 220 }} />
        <button className="btn" type="submit">Check in</button>
      </form>
      {error && <div className="alert error">{error}</div>}
      {result && (
        <div className={`checkin-result ${result.status}`}>
          <h3>{result.status === 'ADMITTED' ? 'Admitted' : 'Already used'} — {result.code}</h3>
          <p style={{ margin: 0 }}>{result.holderName} · {result.tierName} · {result.eventTitle}</p>
          <p className="muted" style={{ margin: '6px 0 0' }}>{result.message}</p>
        </div>
      )}
    </div>
  );
}

function CreateEvent({ onCreated }) {
  const [f, setF] = useState({ title: '', description: '', venue: '', city: '', startsAt: '', endsAt: '' });
  const [tiers, setTiers] = useState([{ name: 'General', priceNpr: 1000, quantity: 200 }]);
  const [error, setError] = useState('');

  const set = (k, v) => setF({ ...f, [k]: v });
  const setTier = (i, k, v) => setTiers(tiers.map((t, j) => j === i ? { ...t, [k]: v } : t));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/organizer/events', {
        method: 'POST',
        body: { ...f, tiers: tiers.map(t => ({ ...t, priceNpr: Number(t.priceNpr), quantity: Number(t.quantity) })) }
      });
      onCreated();
    } catch (err) { setError(err.message); }
  };

  return (
    <form className="form" onSubmit={submit} style={{ maxWidth: 640 }}>
      {error && <div className="alert error">{error}</div>}
      <label>Title<input value={f.title} onChange={e => set('title', e.target.value)} required /></label>
      <label>Description<textarea value={f.description} onChange={e => set('description', e.target.value)} /></label>
      <div className="row">
        <label style={{ flex: 1 }}>Venue<input value={f.venue} onChange={e => set('venue', e.target.value)} required /></label>
        <label style={{ flex: 1 }}>City<input value={f.city} onChange={e => set('city', e.target.value)} required /></label>
      </div>
      <div className="row">
        <label style={{ flex: 1 }}>Starts at<input type="datetime-local" value={f.startsAt} onChange={e => set('startsAt', e.target.value)} required /></label>
        <label style={{ flex: 1 }}>Ends at<input type="datetime-local" value={f.endsAt} onChange={e => set('endsAt', e.target.value)} /></label>
      </div>
      <h4>Ticket tiers</h4>
      {tiers.map((t, i) => (
        <div className="row" key={i}>
          <input placeholder="Name" value={t.name} onChange={e => setTier(i, 'name', e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', flex: 2 }} />
          <input placeholder="Price (Rs)" type="number" min="0" value={t.priceNpr} onChange={e => setTier(i, 'priceNpr', e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', flex: 1 }} />
          <input placeholder="Qty" type="number" min="1" value={t.quantity} onChange={e => setTier(i, 'quantity', e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--line)', flex: 1 }} />
          {tiers.length > 1 && <button type="button" className="btn ghost" onClick={() => setTiers(tiers.filter((_, j) => j !== i))}>✕</button>}
        </div>
      ))}
      <div><button type="button" className="btn ghost" onClick={() => setTiers([...tiers, { name: '', priceNpr: 500, quantity: 100 }])}>+ Add tier</button></div>
      <button className="btn" type="submit">Publish event</button>
    </form>
  );
}

export default function Organizer() {
  const { user, loading, isOrganizer } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);

  const load = () => api('/api/organizer/events').then(setEvents).catch(() => {});
  useEffect(() => {
    if (!loading && !isOrganizer) nav('/');
    if (isOrganizer) load();
  }, [loading, isOrganizer]);

  if (loading || !isOrganizer) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1>Organizer dashboard</h1>
      <div className="tabs">
        <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>My events</button>
        <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Create event</button>
        <button className={tab === 'checkin' ? 'active' : ''} onClick={() => setTab('checkin')}>Check-in</button>
      </div>

      {tab === 'create' && <CreateEvent onCreated={() => { load(); setTab('events'); }} />}

      {tab === 'events' && (
        events.length === 0 ? <p className="muted">No events yet — create your first one.</p> :
        <div className="grid">
          {events.map(e => {
            const sold = e.tiers.reduce((s, t) => s + t.quantitySold, 0);
            const revenue = e.tiers.reduce((s, t) => s + t.quantitySold * t.priceNpr, 0);
            return (
              <div className="card" key={e.id}>
                <h3 style={{ margin: '0 0 6px' }}>{e.title}</h3>
                <p className="muted" style={{ margin: '0 0 10px', fontSize: 14 }}>{fmtDate(e.startsAt)} · {e.city}</p>
                <table className="data">
                  <thead><tr><th>Tier</th><th>Price</th><th>Sold</th></tr></thead>
                  <tbody>
                    {e.tiers.map(t => <tr key={t.id}><td>{t.name}</td><td>{fmtNpr(t.priceNpr)}</td><td>{t.quantitySold}/{t.quantityTotal}</td></tr>)}
                  </tbody>
                </table>
                <p className="mt"><b>{sold}</b> tickets · <b>{fmtNpr(revenue)}</b> revenue · <span className={`badge ${e.status}`}>{e.status}</span></p>
                {e.status === 'PUBLISHED' &&
                  <button className="btn danger" onClick={async () => {
                    if (confirm('Cancel this event?')) {
                      await api(`/api/organizer/events/${e.id}/cancel`, { method: 'POST' });
                      load();
                    }
                  }}>Cancel event</button>}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'checkin' && <CheckinBox />}
    </>
  );
}
