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

const KEY = 'ts_demo_v2';
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
        tagline: 'An open-air night of Nepali indie, folk fusion and electronica beneath the winter sky.',
        description: 'Himalayan Beats returns to Patan Durbar Square for its biggest edition yet — five acts, one historic stage, and 3,000 voices singing along under the stars.\n\nThe square\'s ancient courtyards become a natural amphitheatre: sarangi melodies bleed into synth basslines, folk percussion meets four-on-the-floor, and the headliner closes with a set the valley will talk about for months. Food stalls from Lalitpur\'s best kitchens line the palace courtyard from 4 PM.',
        category: 'Music', image: '/img/concert.jpg', featured: true, attending: 2841,
        tags: ['live music', 'festival', 'outdoor', 'concert'],
        venue: 'Patan Durbar Square', venueAddress: 'Mangal Bazaar, Lalitpur', city: 'Lalitpur',
        startsAt: new Date(now + 21 * day).toISOString(), endsAt: new Date(now + 21 * day + 6 * 3600000).toISOString(), status: 'PUBLISHED',
        lineup: [
          { name: 'The Midnight Karavan', role: 'Headliner · indie rock' },
          { name: 'Sahara Collective', role: 'Folk fusion ensemble' },
          { name: 'Asta & The Echoes', role: 'Opening act · dream pop' },
          { name: 'DJ Yuvraj', role: 'Closing electronica set' }
        ],
        schedule: [
          { time: '4:00 PM', title: 'Gates open', desc: 'Food stalls, merch booth and sunset views over the square.' },
          { time: '5:30 PM', title: 'Asta & The Echoes', desc: 'Dream-pop opener as the light fades.' },
          { time: '7:00 PM', title: 'Sahara Collective', desc: 'Sarangi, madal and synths — folk fusion at full power.' },
          { time: '8:30 PM', title: 'The Midnight Karavan', desc: 'Headline set. Expect the new album played front to back.' },
          { time: '10:30 PM', title: 'DJ Yuvraj', desc: 'Closing electronica set till late.' }
        ],
        organizerAbout: 'Sagar Events has staged 40+ live shows across the Kathmandu Valley since 2019.',
        faq: [
          { q: 'What is the refund policy?', a: 'Full refund if the event is cancelled. 50% refund for cancellations up to 7 days before the show — just email us your order ID.' },
          { q: 'Is there an age limit?', a: 'All ages welcome. Children under 12 enter free with a ticket-holding guardian.' },
          { q: 'Can I re-enter after leaving?', a: 'No re-entry after 8:00 PM for security reasons.' },
          { q: 'Can I bring food or drinks?', a: 'Outside food and drinks are not allowed, but 12+ local food stalls will be inside the venue.' }
        ] },
      { id: 2, organizerEmail: 'organizer@demo.np', title: 'Kathmandu Tech Summit 2026',
        tagline: 'Two days of talks, workshops and a builder showcase for Nepal\'s engineering community.',
        description: 'The summit is where Nepal\'s builders meet: backend engineers, IoT tinkerers, AI researchers and founders, across two packed days at Nepal Academy Hall.\n\nDay one is talks — scaling systems, edge computing, applied AI — from engineers shipping real products. Day two is hands-on: workshops on Spring Boot, ESP32 fleets and RAG pipelines, capped at 40 seats each, plus an evening builder showcase where ten teams demo what they shipped that month.',
        category: 'Tech', image: '/img/tech.jpg', attending: 1204,
        tags: ['conference', 'developers', 'AI', 'IoT', 'workshops'],
        venue: 'Nepal Academy Hall', venueAddress: 'Kamaladi, Kathmandu', city: 'Kathmandu',
        startsAt: new Date(now + 45 * day).toISOString(), endsAt: new Date(now + 46 * day + 8 * 3600000).toISOString(), status: 'PUBLISHED',
        lineup: [
          { name: 'Anisha Karki', role: 'Keynote · Scaling systems to millions' },
          { name: 'Bibek Thapa', role: 'IoT at the edge' },
          { name: 'Prerana Shah', role: 'Applied AI in production' },
          { name: 'Rohan Shrestha', role: 'Postgres deep dive' }
        ],
        schedule: [
          { time: 'Day 1 · 9:00 AM', title: 'Registration & coffee', desc: 'Badge pickup and networking.' },
          { time: 'Day 1 · 10:00 AM', title: 'Keynote', desc: 'Anisha Karki on scaling systems to millions of users.' },
          { time: 'Day 1 · 11:30 AM', title: 'Talk track', desc: 'Four 30-minute engineering talks across two halls.' },
          { time: 'Day 1 · 2:00 PM', title: 'Panel: AI in production', desc: 'What actually works, what does not.' },
          { time: 'Day 2 · 10:00 AM', title: 'Workshops', desc: 'Hands-on: Spring Boot, ESP32 fleets, RAG pipelines. 40 seats each.' },
          { time: 'Day 2 · 5:00 PM', title: 'Builder showcase', desc: 'Ten teams demo what they shipped. Audience vote for best build.' }
        ],
        organizerAbout: 'Sagar Events partners with local engineering communities to run the valley\'s most practical tech gatherings.',
        faq: [
          { q: 'Do I need a student ID for the Student tier?', a: 'Yes — bring a valid student ID to registration. Without one you can upgrade to Professional at the door.' },
          { q: 'Are the talks recorded?', a: 'Keynotes and the panel are recorded and shared with all ticket holders after the summit.' },
          { q: 'Can I transfer my ticket?', a: 'Yes, tickets are transferable until 48 hours before the event from your My Tickets page.' }
        ] },
      { id: 3, organizerEmail: 'organizer@demo.np', title: 'Neon Nights: DJ Rave',
        tagline: 'Five DJs. One warehouse of light. The valley\'s biggest Halloween rave.',
        description: 'Club Fahrenheit goes full Neon Nights for Halloween: five DJs across two rooms, a laser rig imported for one night only, and a costume contest at midnight with Rs. 50,000 in prizes.\n\nRoom one is peak-time techno and hard groove; room two is drum & bass and dubstep till 3 AM. Costumes encouraged — the best-dressed raver takes home the grand prize.',
        category: 'Nightlife', image: '/img/dj.jpg', attending: 932,
        tags: ['dj', 'rave', 'halloween', '18+', 'club'],
        venue: 'Club Fahrenheit', venueAddress: 'Thamel, Kathmandu', city: 'Kathmandu',
        startsAt: new Date(now + 32 * day + 15 * 3600000).toISOString(), endsAt: new Date(now + 32 * day + 21 * 3600000).toISOString(), status: 'PUBLISHED',
        lineup: [
          { name: 'DJ Yuvraj', role: 'Headliner · peak-time techno' },
          { name: 'Nisha Vibe', role: 'Drum & bass' },
          { name: 'KTM Syndicate', role: 'Hard groove B2B' }
        ],
        schedule: [
          { time: '9:00 PM', title: 'Doors open', desc: 'Early arrivals get the warm-up room and shorter bar lines.' },
          { time: '10:30 PM', title: 'Room 2 opens', desc: 'Drum & bass and dubstep till late.' },
          { time: '12:00 AM', title: 'Costume contest', desc: 'Rs. 50,000 in prizes for the best-dressed ravers.' },
          { time: '1:00 AM', title: 'DJ Yuvraj headline set', desc: 'Peak-time techno closing the main room.' }
        ],
        organizerAbout: 'Sagar Events runs the Neon Nights series — four sold-out raves and counting.',
        faq: [
          { q: 'Is there an age limit?', a: 'Strictly 18+. Bring a valid photo ID — no ID, no entry, no refund.' },
          { q: 'What is the costume policy?', a: 'Costumes encouraged but masks covering the full face must be removed at entry for ID checks.' },
          { q: 'Is there parking?', a: 'Limited parking at the venue; ride-shares recommended after midnight.' }
        ] },
      { id: 4, organizerEmail: 'organizer@demo.np', title: 'Laugh Lab: Stand-up Night',
        tagline: 'Six comics, two hours, zero mercy — the valley\'s sharpest stand-up lineup.',
        description: 'Laugh Lab is Kathmandu\'s longest-running comedy night, and this edition packs six of the funniest voices in Nepal onto one stage: observational sets, improv games with the audience, and a no-holds-barred roast battle to close.\n\nThe Comedy Loft\'s brick-walled room seats just 160 — every seat feels front row, and shows regularly sell out days in advance.',
        category: 'Comedy', image: '/img/comedy.jpg', attending: 418,
        tags: ['stand-up', 'comedy', 'improv', 'nightlife'],
        venue: 'The Comedy Loft', venueAddress: 'Jhamsikhel, Lalitpur', city: 'Lalitpur',
        startsAt: new Date(now + 26 * day + 13 * 3600000).toISOString(), endsAt: new Date(now + 26 * day + 15 * 3600000).toISOString(), status: 'PUBLISHED',
        lineup: [
          { name: 'Sajan Malla', role: 'Headliner' },
          { name: 'Diya Rai', role: 'Featured act' },
          { name: 'The Improv Duo', role: 'Audience improv games' }
        ],
        schedule: [
          { time: '7:00 PM', title: 'Doors & seating', desc: 'Bar opens; grab a good seat early.' },
          { time: '7:30 PM', title: 'Opening sets', desc: 'Three rising comics, 10 minutes each.' },
          { time: '8:30 PM', title: 'Diya Rai', desc: 'Featured 25-minute set.' },
          { time: '9:15 PM', title: 'Roast battle finale', desc: 'Sajan Malla closes with the roast battle.' }
        ],
        organizerAbout: 'Sagar Events has produced 60+ comedy nights across the valley.',
        faq: [
          { q: 'Is the show in English or Nepali?', a: 'A mix — most comics switch between Nepali and English naturally.' },
          { q: 'Is it suitable for kids?', a: 'Recommended 16+. Sets are uncensored.' }
        ] },
      { id: 5, organizerEmail: 'organizer@demo.np', title: 'Himalayan Food Fiesta',
        tagline: '60+ stalls, two days, one very happy stomach — Nepal\'s biggest street-food gathering.',
        description: 'Bhrikutimandap transforms into a street-food paradise: 60+ stalls serving everything from Newari bara and yomari to Korean corn dogs and wood-fired pizza, plus live cooking battles, a momo-eating championship, and a craft bazaar.\n\nThe Foodie Pass covers entry on both days plus tasting tokens worth Rs. 500 and skip-the-line access at the ten most popular stalls.',
        category: 'Food', image: '/img/food.jpg', attending: 3560,
        tags: ['food', 'festival', 'family', 'outdoor'],
        venue: 'Bhrikutimandap Exhibition Ground', venueAddress: 'Pradarshani Marg, Kathmandu', city: 'Kathmandu',
        startsAt: new Date(now + 39 * day).toISOString(), endsAt: new Date(now + 40 * day + 10 * 3600000).toISOString(), status: 'PUBLISHED',
        lineup: [
          { name: '60+ food stalls', role: 'Newari · Korean · Italian · Thakali & more' },
          { name: 'Live cooking battles', role: 'Chef showdowns daily at 2 PM' },
          { name: 'Momo-eating championship', role: 'Sunday finale' }
        ],
        schedule: [
          { time: 'Day 1 · 11:00 AM', title: 'Fiesta opens', desc: 'All 60+ stalls fire up their grills.' },
          { time: 'Day 1 · 2:00 PM', title: 'Cooking battle', desc: 'Four chefs, one mystery ingredient.' },
          { time: 'Day 1 · 6:00 PM', title: 'Live folk music', desc: 'Acoustic sets over dinner.' },
          { time: 'Day 2 · 3:00 PM', title: 'Momo-eating championship', desc: 'The finale the crowd comes for.' }
        ],
        organizerAbout: 'Sagar Events\' food festivals have drawn 25,000+ visitors across three editions.',
        faq: [
          { q: 'Is entry ticket inclusive of food?', a: 'Entry covers admission only; food is pay-per-stall. The Foodie Pass includes Rs. 500 in tasting tokens.' },
          { q: 'Is the venue kid-friendly?', a: 'Very — kids under 8 enter free, with a dedicated play area.' }
        ] },
      { id: 6, organizerEmail: 'organizer@demo.np', title: 'Yatra Theatre Festival',
        tagline: 'Three nights of contemporary Nepali theatre, from folk retellings to bold new writing.',
        description: 'Yatra brings three productions to Gurukul Theatre: a folk retelling of the Mahabharata with live dhime baja, a razor-sharp new comedy about Kathmandu landlords, and a minimalist two-hander that won last year\'s national theatre award.\n\nEach evening ends with a 30-minute talkback — the cast and director take questions from the audience.',
        category: 'Arts', image: '/img/theatre.jpg', attending: 267,
        tags: ['theatre', 'drama', 'culture'],
        venue: 'Gurukul Theatre', venueAddress: 'Baneshwor, Kathmandu', city: 'Kathmandu',
        startsAt: new Date(now + 53 * day + 12 * 3600000).toISOString(), endsAt: new Date(now + 55 * day + 15 * 3600000).toISOString(), status: 'PUBLISHED',
        lineup: [
          { name: 'Mahabharata: Folk Retelling', role: 'Night 1 · with live dhime baja' },
          { name: 'Gharbeti', role: 'Night 2 · comedy about Kathmandu landlords' },
          { name: 'Dui Kinaar', role: 'Night 3 · award-winning two-hander' }
        ],
        schedule: [
          { time: 'Night 1 · 6:00 PM', title: 'Mahabharata: Folk Retelling', desc: 'Epic folk theatre with live percussion.' },
          { time: 'Night 2 · 6:00 PM', title: 'Gharbeti', desc: 'A comedy every tenant will recognize.' },
          { time: 'Night 3 · 6:00 PM', title: 'Dui Kinaar', desc: 'National theatre award winner. Talkback follows.' }
        ],
        organizerAbout: 'Sagar Events supports Nepali stage arts with 15+ theatre productions staged since 2021.',
        faq: [
          { q: 'What language are the plays in?', a: 'Primarily Nepali, with English surtitles on all three nights.' },
          { q: 'How long is each show?', a: '90–120 minutes including the audience talkback.' }
        ] }
    ],
    tiers: [
      { id: 1, eventId: 1, name: 'General', priceNpr: 800, quantityTotal: 500, quantitySold: 137 },
      { id: 2, eventId: 1, name: 'Fan Zone', priceNpr: 1500, quantityTotal: 200, quantitySold: 96 },
      { id: 3, eventId: 1, name: 'VIP Deck', priceNpr: 3500, quantityTotal: 50, quantitySold: 41 },
      { id: 4, eventId: 2, name: 'Student', priceNpr: 500, quantityTotal: 300, quantitySold: 58 },
      { id: 5, eventId: 2, name: 'Professional', priceNpr: 2500, quantityTotal: 400, quantitySold: 203 },
      { id: 6, eventId: 2, name: 'Workshop + Conference', priceNpr: 5000, quantityTotal: 100, quantitySold: 77 },
      { id: 7, eventId: 3, name: 'Early Bird', priceNpr: 1000, quantityTotal: 150, quantitySold: 150 },
      { id: 8, eventId: 3, name: 'General', priceNpr: 1800, quantityTotal: 300, quantitySold: 214 },
      { id: 9, eventId: 4, name: 'Regular', priceNpr: 600, quantityTotal: 120, quantitySold: 88 },
      { id: 10, eventId: 4, name: 'Front Row', priceNpr: 1000, quantityTotal: 40, quantitySold: 33 },
      { id: 11, eventId: 5, name: 'Entry', priceNpr: 300, quantityTotal: 1000, quantitySold: 612 },
      { id: 12, eventId: 5, name: 'Foodie Pass', priceNpr: 800, quantityTotal: 400, quantitySold: 351 },
      { id: 13, eventId: 6, name: 'Balcony', priceNpr: 500, quantityTotal: 150, quantitySold: 97 },
      { id: 14, eventId: 6, name: 'Orchestra', priceNpr: 900, quantityTotal: 100, quantitySold: 64 }
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
