import { demoApi } from './demoApi';

// Auto demo-mode: when no API URL is configured (e.g. the static Vercel build),
// the app runs fully in-browser via demoApi. Set VITE_API_URL to point at a
// real backend, or force demo with VITE_DEMO_MODE=true.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !API_URL;
const BASE = API_URL || 'http://localhost:8080';
export const apiBase = BASE;

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  if (DEMO_MODE) {
    return demoApi(path, { method, body }); // throws on error, same contract
  }
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('ts_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export function sseSubscribe(eventId, onMsg) {
  if (DEMO_MODE) {
    const t = setTimeout(() => onMsg({}), 500);
    return () => clearTimeout(t);
  }
  const es = new EventSource(BASE + '/api/events/' + eventId + '/seats/stream');
  es.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch { /* ignore */ } };
  return () => es.close();
}

export const fmtNpr = (n) => 'Rs. ' + Number(n).toLocaleString('en-IN');

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
