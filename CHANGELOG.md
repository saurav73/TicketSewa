# Changelog — TicketSewa

All notable changes to this project, newest first.



## 2026-11-11
- Re-verified: the 21 handler mappings (11 GET + 10 POST) across the 6 controllers are unchanged and the README's API table still lists all 21; the code map still matches the sources (36 main Java files in 8 packages, 17 frontend sources, 9 routes in `App.jsx`); the demo accounts in the README (`organizer@demo.np`, `fan@demo.np`, `admin@demo.np`) still match `DemoSeeder`, including its startup log line; the Docker Compose ports (frontend `3000:80`, API `8080:8080`, MySQL `3306`) and `frontend/.env.example` (`VITE_API_URL`, `VITE_DEMO_MODE`) still match the README; the config table still covers all 14 `${...}` placeholders in `application.yml`

## 2026-11-10
- Re-verified: the 21 handler mappings (11 GET + 10 POST) across the 6 controllers are unchanged; the code map still matches the sources (36 main Java files in 8 packages, 17 frontend sources, 9 routes); the Docker Compose ports (frontend `3000:80`, API `8080:8080`) and `frontend/.env.example` (`VITE_API_URL`, `VITE_DEMO_MODE`) still match the README; the config table still covers all 14 `${...}` placeholders in `application.yml`; the frontend still runs React 18.3 + Vite 5 + React Router 6

## 2026-11-09
- Re-verified: the 21 handler mappings (11 GET + 10 POST) across the 6 controllers are unchanged; the code map still matches the sources (36 main Java files in 8 packages, 17 frontend sources, 9 routes); the Docker Compose healthcheck (`mysqladmin ping`, backend waits on `service_healthy`) and the root Dockerfile's HF Spaces port (7860 via `PORT`) still match the README; the config table still covers all 14 `${...}` placeholders in `application.yml`

## 2026-11-08
- README: architecture diagram now lists all 9 frontend pages (Home, EventDetail, Checkout, Login, Register, MyTickets, Organizer, PaymentSuccess, PaymentFailed) instead of the 5 it named before
- `DemoSeeder`: the startup log line now names all three seeded demo accounts, including the admin account it already created
- Re-verified: the 21 handler mappings (11 GET + 10 POST) across the 6 controllers are unchanged, the race test still asserts 20 buyers x 5 seats on a 50-seat tier with exactly 10 succeeding, and the SSE seat stream path matches between `EventController` and `frontend/src/api.js`

## 2026-11-07
- README: API overview now states the table covers all 21 handler mappings (11 GET + 10 POST) across the 6 controllers, counted from `backend/src/`
- Re-verified: the demo accounts in the README (`organizer@demo.np`, `fan@demo.np`, `admin@demo.np`) match `DemoSeeder`, which also seeds the "Himalayan Beats: Live in Lalitpur" event named in the walkthrough

## 2026-11-06
- README: code map now lists the 9 frontend routes (home, event detail, login, register, checkout, payment success/failed, tickets, organizer), counted from `frontend/src/App.jsx`
- Re-verified: all 6 controller files still present (Auth, Event, Checkout, Payment, Ticket, Health)

## 2026-11-05
- README: code map now states the backend files per package (event 8, ticket 6, user 5, order 5, common 3, payment 3, security 3, config 2, plus the application class = 36 main sources), counted from `backend/src/`
- Re-verified: all 6 controller files still present (Auth, Event, Checkout, Payment, Ticket, Health)

## 2026-11-04
- README: code map now states the 21 backend handler mappings (11 GET + 10 POST) across the 6 controllers, counted from `backend/src/`
- Re-verified: all 6 controller files still present (Auth, Event, Checkout, Payment, Ticket, Health)

## 2026-11-03
- README: code map now states the frontend source total (17 files: 9 pages + App/main/index.css + 4 support modules + EventCard), counted from frontend/src/
- Re-verified: all 6 controller files still present (Auth, Event, Checkout, Payment, Ticket, Health)

## 2026-11-02
- README: code map now states the backend Java file total (39: 36 main sources + 3 integration tests), counted from backend/
- Re-verified: all 6 controller files still present (Auth, Event, Checkout, Payment, Ticket, Health)

## 2026-11-01
- README: code map now lists the 8 backend packages and the frontend support modules (api.js, auth.jsx, demoApi.js, art.js, EventCard.jsx), counted from the sources
- Re-verified: all 6 controller files still present (Auth, Event, Checkout, Payment, Ticket, Health)

## 2026-10-31
- README: new Code map section lists the 6 backend controllers and 9 frontend pages, counted from the sources
- Re-verified against docker-compose.yml: backend waits on the healthy database, demo mode is on by default in Compose

## 2026-10-30
- README: Quickstart now documents the Compose services (MySQL 8.0 on 3306 with a healthcheck, API on 8080, frontend on 3000 via container port 80)
- Re-verified against docker-compose.yml: backend waits on the healthy database, demo mode is on by default in Compose

## 2026-10-29
- README: FRONTEND_URL default documented - http://localhost:5173 for local dev, http://localhost:3000 under Docker Compose (application.yml default + compose file)
- Re-verified the demo flow against `DemoSeeder`: organizer/fan/admin demo accounts and the Himalayan Beats event are as documented

## 2026-10-28
- README: reservation expiry documented precisely - the scheduled job runs every minute and releases seats on orders unpaid after the 30-minute hold (`OrderService.RESERVATION_MINUTES = 30`)
- Re-verified the demo flow against `DemoSeeder`: organizer/fan/admin demo accounts and the General tier on Himalayan Beats are as documented

## 2026-10-27
- README: pinned the frontend stack in Tech to React 18.3 + Vite 5 + React Router 6, matching frontend/package.json

## 2026-10-26
- README: pinned the Tech line to Spring Boot 3.2.5, matching the `spring-boot-starter-parent` version in `backend/pom.xml`
- Re-verified the quickstart against `docker-compose.yml`: frontend on 3000, API on 8080, and `frontend/.env.example` exists as the Configuration section references it

## 2026-10-25
- README: documented the frontend static-hosting path (`frontend/vercel.json`, Vite preset, build to `dist`) alongside the existing Docker and Hugging Face Spaces API deploys
- Re-verified the Configuration section against `application.yml`: every documented env var (`PORT`, `DB_*`, `JWT_SECRET`, `FRONTEND_URL`, `ESEWA_*`, `SEED_DEMO`) is actually read by the backend — docs accurate

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
