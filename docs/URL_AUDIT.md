# Ruchiloka Café — Complete URL, Origin & Environment Audit

This audit documents every URL, origin rule, OAuth callback, API base URL, and external integration endpoint across `apps/web` and `apps/api`.

## 1. Automated Source Scan Result
All workspace source files (`apps/`, `packages/`, `netlify.toml`) were scanned for `localhost`, `127.0.0.1`, and hardcoded deployment domains.
- Zero hardcoded production or localhost API URLs exist in React components, Next.js pages, Express routes, or shared modules.
- `localhost` defaults exist **strictly** in:
  - `apps/web/src/config/urls.ts` (active only when `environment === 'development'`)
  - `apps/api/src/config/env.ts` (defaults only outside `production`; explicitly **throws** if `NODE_ENV=production` receives any `localhost` or `127.0.0.1` URL in `FRONTEND_URL`, `BACKEND_URL`, `CORS_ALLOWED_ORIGINS`, or `GOOGLE_REDIRECT_URI`)
  - `.env.example` (developer template documentation)

## 2. Frontend URL Resolution (`apps/web/src/config/urls.ts`)

| Variable | Visibility | Dev Behavior | Production / Netlify Behavior |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Public (`NEXT_PUBLIC_*`) | Falls back to `http://localhost:4000` only if unset in `development` | **Required.** Must be HTTPS origin of deployed API (e.g. `https://ruchiloka-api.onrender.com`). Fails explicitly if missing or `localhost`. |
| `NEXT_PUBLIC_APP_URL` | Public (`NEXT_PUBLIC_*`) | Defaults to `window.location.origin` / `http://localhost:3000` | Set to Netlify site origin (e.g. `https://ruchiloka.netlify.app` or custom domain). |
| `NEXT_PUBLIC_APP_ENV` | Public (`NEXT_PUBLIC_*`) | Optional (`development`) | Optional (`production` / `preview`). |
| `NEXT_PUBLIC_SHOW_DEV_MENU_GUIDE` | Public (`NEXT_PUBLIC_*`) | Shows guidance notice when menu DB is empty in dev | Omit or set `false` in production. |

### Key Frontend Derived URLs
- **API calls (`buildApiV1Url(path)`)**: `${NEXT_PUBLIC_API_BASE_URL}/api/v1${path}`
- **Google OAuth trigger (`buildGoogleOAuthStartUrl(nextPath)`)**: `${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/google?next=<validatedInternalPath>`
- **Open Redirect Guard (`validateSafeInternalRedirect`)**: Rejects `//`, `\`, and full external URLs; only permits safe relative app paths (`/profile`, `/cart`, etc.).

## 3. Backend URL, CORS, Cookie & Secret Configuration (`apps/api/src/config/env.ts`)

| Variable | Visibility | Dev Value | Production Requirement |
|---|---|---|---|
| `NODE_ENV` | Server-only | `development` | `production` |
| `PORT` | Server-only | `4000` | Render/Railway assigns port (`10000` or platform `$PORT`) |
| `DATABASE_URL` | Secret (Server-only) | Local/dev Postgres URL | Managed PostgreSQL SSL URL (Neon / Supabase / Render) |
| `SESSION_SECRET` | Secret (Server-only) | Dev fallback allowed | **Required >= 32 chars random secret.** |
| `FRONTEND_URL` | Server-only | `http://localhost:3000` | **Required non-localhost HTTPS URL** (Netlify origin) |
| `BACKEND_URL` | Server-only | `http://localhost:4000` | **Required non-localhost HTTPS URL** (API host origin) |
| `CORS_ALLOWED_ORIGINS` | Server-only | `http://localhost:3000` | Comma-separated exact HTTPS origins (`https://ruchiloka.netlify.app,...`) |
| `GOOGLE_REDIRECT_URI` | Server-only | `http://localhost:4000/api/v1/auth/google/callback` | `https://<api-domain>/api/v1/auth/google/callback` |
| `ADMIN_NOTIFICATION_EMAIL` | Server-only | Optional comma-separated emails | Supports multiple addresses (`owner@...,manager@...`), merged with Admin Settings DB recipients |

### Cross-Origin Cookie & CSRF Rules (`apps/api/src/modules/auth/auth.service.ts` & `src/app.ts`)
- When `FRONTEND_URL` and `BACKEND_URL` differ in `production`:
  - Session & OAuth state cookies automatically switch to `HttpOnly; Secure; SameSite=None`.
  - CORS strictly enforces `CORS_ALLOWED_ORIGINS` with `credentials: true` and `allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With', 'X-Ruchiloka-CSRF']`.
  - `verifyCsrfOrigin` rejects state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`) from unlisted `Origin` headers with `403 CSRF_ORIGIN_BLOCKED`.

## 4. Google Cloud Console Exact Settings Checklist
When configuring Google OAuth 2.0 Credentials in Google Cloud Console:
- **Authorized JavaScript origins**:
  - Development: `http://localhost:3000`
  - Production: `https://<your-netlify-site>.netlify.app` (and custom domain if attached)
- **Authorized redirect URIs**:
  - Development: `http://localhost:4000/api/v1/auth/google/callback`
  - Production: `https://<your-backend-api-domain>/api/v1/auth/google/callback`

## 5. External Food Delivery & Map Links
- **Google Maps (`packages/shared/src/business.ts`)**: Verified coordinates & directions URL for `174, Road Number 25, Vivekananda Nagar, Kukatpally, Hyderabad, Telangana 500072, India.`
- **Swiggy / Zomato (`apps/api/src/modules/ordering/ordering.adapters.ts`)**: No hardcoded or guessed restaurant slugs exist in source code. Verified listing URLs are entered via `SWIGGY_LISTING_URL` / `ZOMATO_LISTING_URL` or Admin Settings (`admin_settings`). Official partner cart-transfer handoff remains gated behind `ENABLE_SWIGGY_API_HANDOFF=false` and `ENABLE_ZOMATO_API_HANDOFF=false`.
