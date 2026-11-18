# Frontend Dockerfile (used by docker-compose.yml).
# Multi-stage build: Vite bundles the React SPA, then nginx serves the
# static dist/ on port 80. nginx.conf falls back to index.html so
# client-side routes (e.g. /events/:id) load on refresh.
# VITE_API_URL is a build arg — baked in at build time, so Compose passes
# the API base URL (http://localhost:8080); unset it and the app runs in
# fully in-browser demo mode instead.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
