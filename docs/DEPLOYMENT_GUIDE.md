# Ruchiloka Café — Production Deployment & Operations Guide (Netlify + Node API + Managed PostgreSQL)

## Architecture Overview
Because the Netlify frontend exports clean pre-rendered App Router pages directly to CDN (`apps/web/out`) while long-running Express/Prisma workloads, transactional file/media handling, and persistent connection pools perform best on a dedicated Node.js container host, this monorepo deploys cleanly across three tiers:
1. **Frontend (`apps/web`)**: **Netlify** static Next.js export (`netlify.toml` at repo root)
2. **Backend API (`apps/api`)**: **Render** (Blueprint provided in `render.yaml`) or Railway / Fly.io
3. **Database**: **Managed PostgreSQL** (Render PostgreSQL, Neon, or Supabase)

---

## Step 1 — Official Brand Logo Placement (One-Time File Drop)
1. Save the official **Ruchiloka Café** circular emblem logo PNG as:
   `apps/web/public/images/brand/ruchiloka-logo.png`
2. Recommended resolution: transparent or ivory square PNG at `512×512` (or crisp high-DPI PNG).
3. `BrandLogo.tsx` and branded Resend email templates automatically pick up `/images/brand/ruchiloka-logo.png` once placed.

---

## Step 2 — Provision Managed PostgreSQL & Run Migrations
1. Create a PostgreSQL database (Render PostgreSQL `singapore` region recommended closest to Hyderabad, or Neon / Supabase `ap-south-1` Mumbai).
2. Copy the PostgreSQL connection string (`DATABASE_URL`, with `?sslmode=require`).
3. From the repository root (with `DATABASE_URL` exported locally or in backend CI/Shell):
   ```bash
   npm ci
   npm run build:shared
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   ```
4. Seed initial categories, Ruchiloka Kukatpally business settings, Swiggy/Zomato platform rows, and the owner Admin account:
   ```bash
   SEED_ADMIN_EMAIL="owner@ruchilokacafe.com" \
   SEED_ADMIN_PASSWORD="ChangeThisStrongAdminPassword!" \
   SEED_ADMIN_NAME="Ruchiloka Owner" \
   npm --workspace=@ruchiloka/api run prisma:seed
   ```
   > **Note:** Menu dishes are intentionally NOT fabricated in the seed script. Log in at `/login` with your seeded Admin account and open `/admin` -> **Menu Management** to add Ruchiloka's real dishes, variants, add-ons, and INR prices.

---

## Step 3 — Deploy Backend API (`apps/api`) on Render
You can deploy automatically via **`render.yaml`** (Blueprint) or manually create a Web Service:
- **Root Directory**: `.` (monorepo root)
- **Build Command**: `npm ci && npm run build:shared && npm run build:api`
- **Start Command**: `npm --workspace=@ruchiloka/api run prisma:migrate:deploy && npm --workspace=@ruchiloka/api run start`
- **Health Check Path**: `/api/v1/health`

Set these **Backend Environment Variables** (never commit secrets):
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...
SESSION_SECRET=<generate 48-byte hex secret>
SESSION_TTL_DAYS=14

FRONTEND_URL=https://<your-site>.netlify.app
BACKEND_URL=https://<your-api>.onrender.com
CORS_ALLOWED_ORIGINS=https://<your-site>.netlify.app

# Google OAuth 2.0 (see Step 5)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://<your-api>.onrender.com/api/v1/auth/google/callback

# Resend Email Notifications (see Step 6)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Ruchiloka Café <reservations@yourdomain.com>
ADMIN_NOTIFICATION_EMAIL=owner1@yourdomain.com,owner2@yourdomain.com

# Ordering Integrations (keep flags false until official partner credentials are approved)
ENABLE_SWIGGY_API_HANDOFF=false
ENABLE_ZOMATO_API_HANDOFF=false
SWIGGY_LISTING_URL=
ZOMATO_LISTING_URL=

# Optional (recommended on Render so uploaded dish images persist across restarts)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Verify backend health after deploy:
`curl https://<your-api>.onrender.com/api/v1/health` -> expects HTTP `200` with `"database": "ok"`.

---

## Step 4 — Deploy Frontend (`apps/web`) on Netlify
The repository includes a pre-configured `netlify.toml`:
```toml
[build]
  command = "npm run build:shared && npm run build:web"
  publish = "apps/web/out"

[build.environment]
  NODE_VERSION = "20"
```

1. Push this repository to GitHub / GitLab.
2. In **Netlify Dashboard -> Add new site -> Import an existing project**:
   - Select the repository.
   - Netlify automatically detects `netlify.toml` (`command` and `publish`).
3. Under **Site configuration -> Environment variables**, add:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://<your-api>.onrender.com` (no trailing slash)
   - `NEXT_PUBLIC_APP_URL` = `https://<your-site>.netlify.app`
   - `NEXT_PUBLIC_APP_ENV` = `production`
   - *(Do NOT add `SESSION_SECRET`, `RESEND_API_KEY`, `DATABASE_URL`, or `GOOGLE_CLIENT_SECRET` to Netlify.)*
4. Trigger **Deploy site**.
5. Once Netlify gives your final URL (or custom domain), verify `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` on your Render backend match that exact origin (`https://...` without trailing slash).
6. **Custom Domain Tip (Recommended for Safari / strict browsers)**:
   Attach `ruchilokacafe.com` to Netlify and `api.ruchilokacafe.com` (CNAME) to Render. Because both share the same root site, session cookies act as first-party cookies across all browsers including strict Safari ITP.

---

## Step 5 — Google Cloud OAuth 2.0 Setup
1. Open [Google Cloud Console -> APIs & Services -> Credentials](https://console.cloud.google.com/apis/credentials).
2. Configure OAuth Consent Screen (External, App Name: `Ruchiloka Café`).
3. Create **OAuth 2.0 Client ID -> Web application**:
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://<your-site>.netlify.app` (or custom domain)
   - **Authorized redirect URIs**:
     - `http://localhost:4000/api/v1/auth/google/callback`
     - `https://<your-api>.onrender.com/api/v1/auth/google/callback`
4. Copy `Client ID` and `Client Secret` into Render (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`).

---

## Step 6 — Resend Transactional Emails & Multi-Recipient Admin Alerts
1. Verify your sending domain in [Resend](https://resend.com/domains) (add SPF/DKIM DNS records).
2. Create a Resend API key and set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (`Ruchiloka Café <reservations@yourdomain.com>`).
3. Add multiple owner/manager email recipients either via:
   - Environment variable `ADMIN_NOTIFICATION_EMAIL=owner@...,manager@...` (comma-separated)
   - Admin Dashboard (`/admin` -> **Business & Ordering Settings** -> **Notification Recipient Emails**)
4. Delivery receipts & retry attempts for every recipient are persisted in PostgreSQL (`email_logs`).

---

## Step 7 — Swiggy & Zomato Ordering Activation
- **Current verified behavior (`VERIFIED_LISTING_FALLBACK`)**: Customers build carts on Ruchiloka Café (`localStorage` + PostgreSQL cart sync), view INR totals computed strictly on the server, click **Order Now**, select Swiggy or Zomato, copy the one-click formatted order checklist, and open Ruchiloka's verified Swiggy/Zomato listing URL configured in Admin Settings.
- **Full Partner API Cart Transfer**: Requires approved partner/merchant onboarding with Swiggy (`developers.swiggy.com` / `mcp.swiggy.com/food`) or Zomato (`zomato.com/developer/integration`), mapping `ExternalRestaurantMapping` and `ExternalItemMapping` records, setting partner credentials, and enabling `ENABLE_SWIGGY_API_HANDOFF=true` / `ENABLE_ZOMATO_API_HANDOFF=true`.
