# Changelog — TicketSewa

All notable changes to this project, newest first.

## 2026-10-24
- README: documented the Hugging Face Spaces deployment path (root `Dockerfile` was already HF-ready on port 7860 via `PORT`, but the README never mentioned it)
- Re-verified the deployment claims: `docker-compose.yml` ports (frontend 3000, API 8080, MySQL 3306) match the quickstart; `frontend/src/api.js` reads `VITE_API_URL`/`VITE_DEMO_MODE` exactly as the Configuration section describes; the three concurrency tests (`InventoryRaceTest`, `IdempotentVerificationTest`, `DoubleCheckinTest`) exist; `SEED_DEMO` is wired in `application.yml`; no `console.log` leftovers in the frontend — docs accurate

## 2026-10-23
- Re-verified the README API overview against the backend: all 21 mapped routes are documented across the 19 table rows (3 rows cover two routes each), ports (8080/3000), ports for docker and vite (5173) accurate, and every `${ENV}` var in `application.yml` is listed in the configuration section — docs accurate, no changes needed


All notable changes to this project, newest first.

## 2026-10-22
- Removed the unused `org.springframework.data.repository.query.Param` import from `EventRepository`
- Re-verified the README API table and quick-start against the backend mappings and docker-compose.yml: all 19 routes documented, ports (8080/3000) still accurate; no doc changes needed

## 2026-10-21

- Docs: class-level Javadoc on the remaining undocumented backend classes —
  `TicketTierRepository`, `TicketRepository`, `OrderStatus`,
  `PaymentController`, `CustomUserDetailsService`, `JwtService`,
  `QrCodeService`, `AuthService` (every main-source class now documented).
- Docs: file-header JSDoc on all remaining frontend files — `api.js`,
  `main.jsx`, `components/EventCard.jsx`, and the pages
  (Home, EventDetail, Checkout, Login, Register, MyTickets, Organizer,
  PaymentSuccess, PaymentFailed).

## 2026-10-20

- README: added the two remaining undocumented endpoints to the API table —
  `GET /api/orders/{id}` (single order detail) and `GET /api/health`
  (liveness probe for cloud health checks).
- Config docs: `application.yml` now warns above `app.jwt.secret` that the
  bundled default JWT secret is dev-only and must be replaced with a long
  random `JWT_SECRET` in every deployed environment.

## 2026-10-19

- README: added the three existing endpoints missing from the API table —
  `POST /api/organizer/events/{id}/cancel` (ORGANIZER+), `GET /api/orders/mine`
  (own orders), and `GET /api/auth/me` (current user profile).

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
