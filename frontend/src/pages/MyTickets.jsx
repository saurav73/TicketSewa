import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DEMO_MODE, apiBase, fmtDate } from '../api';
import { demoQrDataUrl } from '../demoApi';
import { gradFor } from '../art';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [qr, setQr] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/tickets/mine').then(setTickets).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    tickets.forEach(async (t) => {
      if (qr[t.id]) return;
      if (DEMO_MODE) {
        setQr(prev => ({ ...prev, [t.id]: 'loading' }));
        const url = await demoQrDataUrl(t.code);
        setQr(prev => ({ ...prev, [t.id]: url }));
      } else {
        const token = localStorage.getItem('ts_token');
        const res = await fetch(`${apiBase}/api/tickets/${t.id}/qr`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const blob = await res.blob();
          setQr(prev => ({ ...prev, [t.id]: URL.createObjectURL(blob) }));
        }
      }
    });
  }, [tickets]);

  if (loading) return <p className="muted">Loading tickets…</p>;

  return (
    <>
      <h1>My Tickets</h1>
      {tickets.length === 0 ? <p className="muted">No tickets yet. <Link to="/" style={{ textDecoration: 'underline' }}>Find an event</Link>.</p> :
        <div className="grid">
          {tickets.map(t => (
            <div className="pass" key={t.id}>
              <div className="stub">
                {qr[t.id] && qr[t.id] !== 'loading'
                  ? <img src={qr[t.id]} alt={`QR for ${t.code}`} />
                  : <div className="muted" style={{ fontSize: 13 }}>Generating QR…</div>}
                <div className="code">{t.code}</div>
              </div>
              <div className="info">
                <div style={{ height: 6, borderRadius: 4, background: gradFor(t.id), marginBottom: 12 }} />
                <h3>{t.eventTitle}</h3>
                <p className="meta">{t.tierName} · {t.venue}, {t.city}</p>
                <p className="meta">{fmtDate(t.startsAt)}</p>
                <span className={`badge ${t.status}`}>{t.status}</span>
              </div>
            </div>
          ))}
        </div>}
      <p className="demo-note mt">Show the QR at the gate — the organizer scans it to check you in.</p>
    </>
  );
}
