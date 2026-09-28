/**
 * Demo-mode API: a complete in-memory reimplementation of the TicketSewa
 * backend that runs entirely in the browser. Used for the Vercel deployment
 * so the live demo is fully interactive without a Java/MySQL host.
 *
 * The real backend (Spring Boot) lives in /backend — this mirrors its
 * endpoints, status codes and business rules (atomic seat reservation,
 * idempotent verification, one-time check-in).
 */
import QRCode from 'qrcode';

const KEY = 'ts_demo_v1';
const LATENCY = 250;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const rid = (p) => p + Math.random().toString(36).slice(2, 10).toUpperCase();
const newCode = () => 'TS-' + [...Array(8)].map(() => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

function seed() {
  const day = 86400000;
  const now = Date.now();
  return {
    seq: 100,
    users: [
      { name: 'Sagar Events', email: 'organizer@demo.np', pass: 'organizer123', role: 'ORGANIZER' },
      { name: 'Demo Fan', email: 'fan@demo.np', pass: 'fan12345', role: 'ATTENDEE' },
      { name: 'Site Admin', email: 'admin@demo.np', pass: 'admin12345', role: 'ADMIN' }
    ],
    events: [
      { id: 1, organizerEmail: 'organizer@demo.np', title: 'Himalayan Beats: Live in Lalitpur',
        description: 'An open-air night of Nepali indie, folk fusion and electronic sets under the winter sky. Gates open 4 PM.',
        venue: 'Patan Durbar Square', city: 'Lalitpur',
        startsAt: new Date(now + 21 * day).toISOString(), endsAt: new Date(now + 21 * day + 5 * 3600000).toISOString(), status: 'PUBLISHED' },
      { id: 2, organizerEmail: 'organizer@demo.np', title: 'Kathmandu Tech Summit 2026',
        description: 'Two days of talks and workshops on backend engineering, IoT and AI — with a builder showcase on day two.',
        venue: 'Nepal Academy Hall', city: 'Kathmandu',
        startsAt: new Date(now + 45 * day).toISOString(), endsAt: new Date(now + 46 * day).toISOString(), status: 'PUBLISHED' }
    ],
    tiers: [
      { id: 1, eventId: 1, name: 'General', priceNpr: 800, quantityTotal: 500, quantitySold: 137 },
      { id: 2, eventId: 1, name: 'Fan Zone', priceNpr: 1500, quantityTotal: 200, quantitySold: 96 },
      { id: 3, eventId: 1, name: 'VIP Deck', priceNpr: 3500, quantityTotal: 50, quantitySold: 41 },
      { id: 4, eventId: 2, name: 'Student', priceNpr: 500, quantityTotal: 300, quantitySold: 58 },
      { id: 5, eventId: 2, name: 'Professional', priceNpr: 2500, quantityTotal: 400, quantitySold: 203 },
      { id: 6, eventId: 2, name: 'Workshop + Conference', priceNpr: 5000, quantityTotal: 100, quantitySold: 77 }
    ],
    orders: [],
    tickets: []
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted -> reseed */ }
  const db = seed();
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}
function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }

function err(status, message) {
  const e = new Error(message);
  e.status = status;
  throw e;
}
const emailOf = (token) => token && token.startsWith('demo-') ? token.slice(5) : null;
const requireUser = (db, token) => {
  const email = emailOf(token);
  const u = db.users.find(x => x.email === email);
  if (!u) err(401, 'Not authenticated');
  return u;
};

const eventDto = (db, e) => ({
  ...e,
  organizerName: (db.users.find(u => u.email === e.organizerEmail) || {}).name || 'Organizer',
  tiers: db.tiers.filter(t => t.eventId === e.id).map(t => ({ ...t, remaining: t.quantityTotal - t.quantitySold }))
});
const orderDto = (db, o) => {
  const e = db.events.find(x => x.id === o.eventId) || {};
  const t = db.tiers.find(x => x.id === o.tierId) || {};
  return { id: o.id, eventId: o.eventId, eventTitle: e.title, tierId: o.tierId, tierName: t.name,
    quantity: o.quantity, amountNpr: o.amountNpr, status: o.status, createdAt: o.createdAt };
};
const ticketDto = (db, t) => {
  const e = db.events.find(x => x.id === t.eventId) || {};
  const tier = db.tiers.find(x => x.id === t.tierId) || {};
  return { id: t.id, code: t.code, eventTitle: e.title, tierName: tier.name, venue: e.venue,
    city: e.city, startsAt: e.startsAt, status: t.status };
};

function issueTickets(db, order) {
  for (let i = 0; i < order.quantity; i++) {
    db.tickets.push({ id: ++db.seq, orderId: order.id, holderEmail: order.userEmail,
      eventId: order.eventId, tierId: order.tierId, code: newCode(),
      status: 'VALID', usedAt: null, createdAt: new Date().toISOString() });
  }
}

export async function demoApi(path, { method = 'GET', body } = {}) {
  await wait(LATENCY);
  const db = load();
  const token = localStorage.getItem('ts_token');
  const seg = path.split('/').filter(Boolean); // ['api', ...]

  // ---- auth ----
  if (path === '/api/auth/register' && method === 'POST') {
    const { name, email, password, role } = body;
    const em = email.trim().toLowerCase();
    if (db.users.some(u => u.email === em)) err(409, 'Email already registered');
    if ((role || 'ATTENDEE') === 'ADMIN') err(403, 'Cannot self-register as admin');
    db.users.push({ name: name.trim(), email: em, pass: password, role: role || 'ATTENDEE' });
    save(db);
    return { token: 'demo-' + em, name: name.trim(), email: em, role: role || 'ATTENDEE' };
  }
  if (path === '/api/auth/login' && method === 'POST') {
    const em = body.email.trim().toLowerCase();
    const u = db.users.find(x => x.email === em && x.pass === body.password);
    if (!u) err(401, 'Invalid email or password');
    return { token: 'demo-' + em, name: u.name, email: em, role: u.role };
  }
  if (path === '/api/auth/me') {
    const u = requireUser(db, token);
    return { name: u.name, email: u.email, role: u.role };
  }

  // ---- public events ----
  if (path.startsWith('/api/events') && method === 'GET') {
    if (seg.length === 2) {
      const list = db.events.filter(e => e.status === 'PUBLISHED')
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).map(e => eventDto(db, e));
      return { content: list, totalElements: list.length };
    }
    const id = Number(seg[2]);
    const e = db.events.find(x => x.id === id && x.status === 'PUBLISHED');
    if (!e) err(404, 'Event not found');
    return eventDto(db, e);
  }

  const me = () => requireUser(db, token);
  const isOrg = (u) => u.role === 'ORGANIZER' || u.role === 'ADMIN';

  // ---- organizer ----
  if (path === '/api/organizer/events' && method === 'GET') {
    const u = me();
    if (!isOrg(u)) err(403, 'Organizer only');
    const mine = u.role === 'ADMIN' ? db.events : db.events.filter(e => e.organizerEmail === u.email);
    return mine.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt)).map(e => eventDto(db, e));
  }
  if (path === '/api/organizer/events' && method === 'POST') {
    const u = me();
    if (!isOrg(u)) err(403, 'Organizer only');
    if (new Date(body.startsAt) < new Date()) err(400, 'Event must start in the future');
    const e = { id: ++db.seq, organizerEmail: u.email, title: body.title.trim(),
      description: body.description || '', venue: body.venue.trim(), city: body.city.trim(),
      startsAt: new Date(body.startsAt).toISOString(),
      endsAt: body.endsAt ? new Date(body.endsAt).toISOString() : null, status: 'PUBLISHED' };
    db.events.push(e);
    for (const t of body.tiers) {
      db.tiers.push({ id: ++db.seq, eventId: e.id, name: t.name.trim(),
        priceNpr: Number(t.priceNpr), quantityTotal: Number(t.quantity), quantitySold: 0 });
    }
    save(db);
    return eventDto(db, e);
  }
  if (seg[1] === 'organizer' && seg[2] === 'events' && seg[4] === 'cancel' && method === 'POST') {
    const u = me();
    const e = db.events.find(x => x.id === Number(seg[3]));
    if (!e) err(404, 'Event not found');
    if (u.role !== 'ADMIN' && e.organizerEmail !== u.email) err(403, 'Not your event');
    e.status = 'CANCELLED';
    save(db);
    return null;
  }

  // ---- orders ----
  if (path === '/api/orders' && method === 'POST') {
    const u = me();
    const { eventId, tierId, quantity, idempotencyKey } = body;
    if (idempotencyKey) {
      const dupe = db.orders.find(o => o.idempotencyKey === idempotencyKey);
      if (dupe) return orderDto(db, dupe);
    }
    const e = db.events.find(x => x.id === Number(eventId));
    if (!e || e.status !== 'PUBLISHED') err(400, 'Event is not on sale');
    const t = db.tiers.find(x => x.id === Number(tierId) && x.eventId === e.id);
    if (!t) err(400, 'Tier does not belong to this event');
    if (quantity < 1 || quantity > 10) err(400, 'Quantity must be 1-10');
    if (t.quantityTotal - t.quantitySold < quantity) err(409, 'Not enough seats left in this tier');
    t.quantitySold += quantity; // single-threaded: atomic by construction
    const o = { id: rid('ord_'), userEmail: u.email, eventId: e.id, tierId: t.id,
      quantity, amountNpr: t.priceNpr * quantity, status: 'PENDING', esewaRefId: null,
      idempotencyKey: idempotencyKey || rid('idem_'), createdAt: new Date().toISOString(), paidAt: null };
    db.orders.push(o);
    save(db);
    return orderDto(db, o);
  }
  if (path === '/api/orders/mine') {
    const u = me();
    return db.orders.filter(o => o.userEmail === u.email)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(o => orderDto(db, o));
  }
  if (seg[1] === 'orders' && seg[3] === 'payment-form' && method === 'POST') {
    const u = me();
    const o = db.orders.find(x => x.id === seg[2] && x.userEmail === u.email);
    if (!o) err(404, 'Order not found');
    if (o.status !== 'PENDING') err(400, 'Order is not payable');
    return { paymentUrl: 'demo', fields: { amt: String(o.amountNpr), pid: o.id }, order: orderDto(db, o) };
  }
  if (seg[1] === 'orders' && seg.length === 3 && method === 'GET') {
    const u = me();
    const o = db.orders.find(x => x.id === seg[2] && x.userEmail === u.email);
    if (!o) err(404, 'Order not found');
    return orderDto(db, o);
  }

  // ---- payments ----
  if (path === '/api/payments/demo/enabled') return { demoMode: true };
  const payOrder = (o) => {
    o.status = 'PAID';
    o.paidAt = new Date().toISOString();
    o.esewaRefId = 'DEMO-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    issueTickets(db, o);
    save(db);
    return orderDto(db, o);
  };
  if (path === '/api/payments/demo/pay' && method === 'POST') {
    const u = me();
    const o = db.orders.find(x => x.id === body.orderId && x.userEmail === u.email);
    if (!o) err(404, 'Order not found');
    if (o.status === 'PAID') return orderDto(db, o);
    if (o.status !== 'PENDING') err(400, 'Order is no longer payable');
    return payOrder(o);
  }
  if (path === '/api/payments/verify' && method === 'POST') {
    const u = me();
    const o = db.orders.find(x => x.id === body.oid && x.userEmail === u.email);
    if (!o) err(404, 'Order not found');
    if (o.status === 'PAID') return orderDto(db, o); // idempotent replay
    if (o.status !== 'PENDING') err(400, 'Order is no longer payable');
    if (o.amountNpr !== Number(body.amt)) err(400, 'Amount mismatch');
    // demo: the "eSewa" verification always succeeds
    return payOrder(o);
  }
  if (path === '/api/payments/failed' && method === 'POST') {
    const u = me();
    const o = db.orders.find(x => x.id === body.oid && x.userEmail === u.email);
    if (o && o.status === 'PENDING') {
      o.status = 'FAILED';
      const t = db.tiers.find(x => x.id === o.tierId);
      if (t) t.quantitySold = Math.max(0, t.quantitySold - o.quantity);
      save(db);
    }
    return null;
  }

  // ---- tickets ----
  if (path === '/api/tickets/mine') {
    const u = me();
    return db.tickets.filter(t => t.holderEmail === u.email)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => ticketDto(db, t));
  }
  if (path === '/api/checkin' && method === 'POST') {
    const u = me();
    const t = db.tickets.find(x => x.code === String(body.code).trim().toUpperCase());
    if (!t) err(404, 'Unknown ticket code');
    const e = db.events.find(x => x.id === t.eventId);
    if (u.role !== 'ADMIN' && e.organizerEmail !== u.email) err(403, 'Only the event organizer can check in tickets');
    const holder = db.users.find(x => x.email === t.holderEmail) || {};
    const tier = db.tiers.find(x => x.id === t.tierId) || {};
    const base = { code: t.code, eventTitle: e.title, tierName: tier.name, holderName: holder.name };
    if (t.status !== 'VALID') {
      save(db);
      return { ...base, status: 'ALREADY_USED', message: 'Ticket was already used' };
    }
    t.status = 'USED';
    t.usedAt = new Date().toISOString();
    save(db);
    return { ...base, status: 'ADMITTED', message: 'Welcome in!' };
  }

  err(404, 'Unknown endpoint: ' + path);
}

export async function demoQrDataUrl(code) {
  return QRCode.toDataURL('TICKETSEWA:' + code, { width: 320, margin: 1 });
}

export function resetDemo() {
  localStorage.removeItem(KEY);
}
