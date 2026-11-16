/**
 * Backend API client: thin fetch wrapper over /api with JWT auth headers,
 * NPR/date formatters, and SSE subscription for live seat counts.
 * Routes requests to demoApi in demo mode (Vercel static build without a
 * Java backend configured). Set VITE_API_URL to point at a real backend.
 */
import { demoApi } from './demoApi';

// Auto demo-mode: when no API URL is configured (e.g. the static Vercel build),
// the app runs fully in-browser via demoApi. Set VITE_API_URL to point at a
// real backend, or force demo with VITE_DEMO_MODE=true.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
/** True when the app runs without a real backend (no VITE_API_URL, or VITE_DEMO_MODE=true); API calls are then served in-browser by demoApi. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || !API_URL;
const BASE = API_URL || 'http://localhost:8080';
/** Base URL for backend requests (the configured API URL, or the local dev backend). */
export const apiBase = BASE;

/**
 * Calls the backend (or demoApi in demo mode).
 * @param {string} path - API path, e.g. '/api/events'.
 * @param {object} [opts] - { method, body, auth } (defaults: GET, no body, JWT attached).
 * @returns {Promise<any>} Parsed JSON (or text for non-JSON responses); null on 204.
 * @throws {Error} With the backend's error message, or `Request failed (<status>)`.
 */
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

/**
 * Subscribes to live seat-count updates for an event via SSE.
 * @param {number|string} eventId - Event to watch.
 * @param {(msg: object) => void} onMsg - Called with each seat update (an empty object once in demo mode).
 * @returns {() => void} Unsubscribe function that closes the stream.
 */
export function sseSubscribe(eventId, onMsg) {
  if (DEMO_MODE) {
    const t = setTimeout(() => onMsg({}), 500);
    return () => clearTimeout(t);
  }
  const es = new EventSource(BASE + '/api/events/' + eventId + '/seats/stream');
  es.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch { /* ignore */ } };
  return () => es.close();
}

/** Formats an amount as Nepalese rupees, e.g. 'Rs. 1,500'. */
export const fmtNpr = (n) => 'Rs. ' + Number(n).toLocaleString('en-IN');

/** Formats an ISO date as e.g. '16 Nov 2026, 07:11'. */
export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
