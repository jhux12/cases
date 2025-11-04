---
title: cases
emoji: 🐳
colorFrom: gray
colorTo: green
sdk: static
pinned: false
tags:
  - deepsite
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

## Content Security Policy

To allow the reCAPTCHA iframe to load, ensure your hosting platform sends the following header:

```
Content-Security-Policy: frame-ancestors 'self' https://www.google.com https://www.gstatic.com;
```

This policy mirrors the meta tag included in `auth.html`.

## Project layout

The repository is now organised as a small monorepo:

- `frontend/` – a Vite + React single-page application that consumes the API and showcases featured cases.
- `backend/` – an Express server that exposes `/api` endpoints for the frontend (cases catalogue, health check, etc.).
- Legacy static assets (`index.html`, `styles/`, etc.) remain available at the repository root for reference while the new stack evolves.

Root `package.json` scripts proxy to the workspace packages so you can manage everything from one place.

## Getting started locally

1. Install dependencies for both workspaces:

   ```bash
   npm install
   ```

2. Copy the environment examples if you need to customise ports or origins:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Start the API server (defaults to port 5000):

   ```bash
   npm run dev:backend
   ```

4. In a separate terminal, launch the Vite dev server (defaults to port 5173):

   ```bash
   npm run dev:frontend
   ```

5. Open `http://localhost:5173` in your browser. The frontend will fetch data from the backend and render the sample cases grid.

### Production builds

- Run `npm run build` to execute each workspace’s build script.
- Deploy the backend separately or behind your preferred process manager.
- Adjust `VITE_API_BASE_URL` in the frontend `.env` file to point to the deployed API.

## Phone auth domains

If you see `Firebase: Hostname match not found (auth/captcha-check-failed)` when sending the SMS code, add your site's domain to **Authentication → Settings → Authorized domains** in the Firebase console. For local development, the app automatically disables reCAPTCHA verification on `localhost`.
