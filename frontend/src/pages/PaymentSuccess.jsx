import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

/** eSewa redirects here with ?oid=&amt=&refId= — we verify server-side. */
export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const [state, setState] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const oid = params.get('oid'), amt = params.get('amt'), refId = params.get('refId');
    if (!oid || !amt || !refId) { setState('error'); setError('Missing payment parameters.'); return; }
    api('/api/payments/verify', { method: 'POST', body: { oid, amt, refId } })
      .then(() => setState('ok'))
      .catch(e => { setState('error'); setError(e.message); });
  }, []);

  return (
    <>
      <h1>Payment</h1>
      {state === 'verifying' && <p className="muted">Verifying payment with eSewa…</p>}
      {state === 'ok' && (
        <div className="alert ok">Payment verified and tickets issued! <Link to="/tickets" style={{ textDecoration: 'underline', fontWeight: 700 }}>View my tickets</Link></div>
      )}
      {state === 'error' && <div className="alert error">Verification failed: {error}</div>}
    </>
  );
}
