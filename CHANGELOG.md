# Changelog — TicketSewa

All notable changes to this project, newest first.

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
