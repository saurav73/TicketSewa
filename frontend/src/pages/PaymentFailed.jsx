import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

/** eSewa redirects here when the buyer cancels/fails — release held seats. */
export default function PaymentFailed() {
  const [params] = useSearchParams();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const oid = params.get('pid') || params.get('oid');
    if (oid) api('/api/payments/failed', { method: 'POST', body: { oid } }).catch(() => {}).finally(() => setDone(true));
    else setDone(true);
  }, []);

  return (
    <>
      <h1>Payment didn't go through</h1>
      {done && <div className="alert error">The payment was cancelled or failed. Your held seats were released — no money was taken.</div>}
      <p><Link to="/" style={{ textDecoration: 'underline' }}>Back to events</Link></p>
    </>
  );
}
