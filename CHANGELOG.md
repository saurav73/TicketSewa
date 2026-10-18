# Changelog — TicketSewa

All notable changes to this project, newest first.

## 2026-10-18

- Docs: class-level Javadoc on `PurchaseOrderRepository` (idempotency-key
  lookup + pessimistic payment-verification lock); file-header JSDoc on the
  frontend entry files `App.jsx` (route table) and `auth.jsx` (JWT auth
  context).

## 2026-10-16

- Docs: added class-level Javadoc across the backend — ticket domain
  (`Ticket`, `TicketService`, `TicketController`), order domain
  (`PurchaseOrder`, `OrderService`), event (`EventController`,
  `EventService`), plus `SecurityConfig` and `EsewaProperties`.
- README: documented `POST /api/payments/failed` and
  `GET /api/payments/demo/enabled` in the API table (existing endpoints,
  previously missing).

## Unreleased

- Docs: added class-level Javadoc across the backend — event domain
  (`Event`, `EventStatus`, `EventRepository`), `CheckoutController`,
  `AuthController` + `Role`, `JwtAuthFilter`, `GlobalExceptionHandler`,
  `TicketSewaApplication`, and `TicketStatus`.
- Added `backend/.env.example` documenting all backend env vars (mirrors the
  existing `frontend/.env.example`).
- README: documented the `PORT` and `DB_DRIVER` backend env vars and added
  Postgres / H2 to the tech line; added `frontend/.env.example` for
  `VITE_API_URL` and `VITE_DEMO_MODE`.

## 2026-10-09

- README: documented frontend env vars `VITE_API_URL` and `VITE_DEMO_MODE`.

## 2026-09-29

- **Rich frontend:** cinematic hero banners, 6 fully detailed demo events,
  browse-by-category search, and lineup / schedule / FAQ detail pages.
- **Frontend auto demo-mode:** the React app runs fully in-browser via an
  in-memory API mirror (`frontend/src/demoApi.js`) when `VITE_API_URL` is
  unset — so the static Vercel build is a fully interactive demo with no
  backend host. Set `VITE_API_URL` to point at a real backend, or force demo
  with `VITE_DEMO_MODE=true`.
- **Hugging Face Spaces deploy:** root `Dockerfile` exposing port 7860.

## 2026-09-28

- **Cloud-ready backend:** Postgres JDBC driver alongside MySQL, env-driven
  DB driver selection, `PORT` support, `/api/health` probe; Docker gained
  `JAVA_OPTS` support for small cloud instances.
- README: project overview, architecture diagram, quickstart, API table,
  test guide and configuration reference.
