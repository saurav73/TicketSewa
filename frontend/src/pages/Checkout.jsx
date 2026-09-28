import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, DEMO_MODE, fmtNpr } from '../api';

/**
 * Seats are held for 30 minutes once the order is created.
 * Real backend: buyer pays via eSewa (real redirect + server verification)
 * or one-click demo pay. Demo mode (Vercel): simulates the full
 * redirect → callback → verify round-trip in the browser.
 */
export default function Checkout() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [demoMode, setDemoMode] = useState(DEMO_MODE);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState('');

  useEffect(() => {
    api(`/api/orders/${orderId}`).then(setOrder).catch(e => setError(e.message));
    if (!DEMO_MODE) {
      api('/api/payments/demo/enabled', { auth: false }).then(r => setDemoMode(r.demoMode)).catch(() => {});
    }
  }, [orderId]);

  const payWithEsewa = async () => {
    setPaying(true);
    setError('');
    try {
      const { paymentUrl, fields, order: o } = await api(`/api/orders/${orderId}/payment-form`, { method: 'POST' });
      if (DEMO_MODE || paymentUrl === 'demo') {
        // Simulate the eSewa round-trip: redirect out, callback in, server verifies.
        setStep('Redirecting to eSewa…');
        await new Promise(r => setTimeout(r, 900));
        setStep('Confirming payment with eSewa…');
        await api('/api/payments/verify', {
          method: 'POST',
          body: { oid: orderId, amt: String(o.amountNpr), refId: 'DEMO-' + Date.now().toString(36).toUpperCase() }
        });
        nav('/tickets');
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;
      Object.entries(fields).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = k; input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(e.message);
      setPaying(false);
      setStep('');
    }
  };

  const demoPay = async () => {
    setPaying(true);
    setError('');
    try {
      await api('/api/payments/demo/pay', { method: 'POST', body: { orderId } });
      nav('/tickets');
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  };

  if (error && !order) return <div className="alert error">{error}</div>;
  if (!order) return <p className="muted">Loading order…</p>;

  return (
    <>
      <h1>Checkout</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginTop: 0 }}>{order.eventTitle}</h3>
        <div className="summary-row"><span className="k">{order.tierName} × {order.quantity}</span><span>{fmtNpr(order.amountNpr)}</span></div>
        <div className="summary-row"><span className="k">Service fee</span><span>Rs. 0</span></div>
        <div className="summary-row total"><span>Total</span><span>{fmtNpr(order.amountNpr)}</span></div>
        <p><span className={`badge ${order.status}`}>{order.status}</span></p>
        {error && <div className="alert error">{error}</div>}
        {step && <div className="alert info">{step}</div>}
        {order.status === 'PENDING' ? (
          <div className="pay-btns">
            <button className="btn esewa-btn" disabled={paying} onClick={payWithEsewa}>
              {paying ? 'Processing…' : DEMO_MODE ? 'Pay with eSewa (simulated)' : 'Pay with eSewa'}
            </button>
            {!DEMO_MODE && demoMode && (
              <button className="btn ghost" disabled={paying} onClick={demoPay}>
                Demo pay (no wallet)
              </button>
            )}
          </div>
        ) : order.status === 'PAID' ? (
          <div className="alert ok">Paid! Your tickets are ready.</div>
        ) : (
          <div className="alert error">This order is {order.status.toLowerCase()}. Seats were released.</div>
        )}
        {DEMO_MODE && order.status === 'PENDING' && (
          <p className="demo-note">Live demo: this simulates the full eSewa round-trip
            (redirect → callback → server verification → QR ticket issue) without a wallet.</p>
        )}
        {!DEMO_MODE && demoMode && order.status === 'PENDING' && (
          <p className="demo-note">Demo mode is on: "Demo pay" simulates the full eSewa round-trip
            without a wallet.</p>
        )}
        <p className="demo-note">Your seats are held for 30 minutes while you pay.</p>
      </div>
    </>
  );
}
