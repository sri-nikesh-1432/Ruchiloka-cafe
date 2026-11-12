# Ruchiloka Café — Full-Stack Web Application

Full-stack restaurant platform for **Ruchiloka Café** (174, Road Number 25, Vivekananda Nagar, Kukatpally, Hyderabad, Telangana 500072, India · `+91 91216 78449` · `Asia/Kolkata` IST).

## Monorepo Architecture

- `apps/web` (`@ruchiloka/web`): Next.js 15 App Router, TypeScript, Tailwind CSS, Framer Motion, React Hook Form + Zod. Ready for **Netlify** (`netlify.toml`).
- `apps/api` (`@ruchiloka/api`): Express, TypeScript, Prisma ORM (PostgreSQL), session auth (`HttpOnly` cookie), Google OAuth 2.0, Resend multi-recipient email alerts, Swiggy/Zomato adapter framework. Ready for **Render** (`render.yaml`) or any Node.js host.
- `packages/shared` (`@ruchiloka/shared`): Shared Zod schemas, TypeScript DTOs, business constants, and live `Asia/Kolkata` operating-hours & slot utilities.

## Quick Verification & Build Commands

```bash
# Install dependencies across workspaces
npm install

# Build all packages (shared -> web -> api)
npm run build

# Run shared & API test suites
npm test

# Typecheck individual apps
npm --workspace=@ruchiloka/web run typecheck
npm --workspace=@ruchiloka/api run typecheck
```

## Key Documentation & Setup

- [Deployment Guide (Netlify + Render + PostgreSQL + Google OAuth + Resend)](docs/DEPLOYMENT_GUIDE.md)
- [URL, Origin & Environment Audit](docs/URL_AUDIT.md)
- [Photography & Image Sources](docs/IMAGE_CREDITS.md)
- **Official Logo Slot**: Drop the transparent/high-DPI Ruchiloka Café logo at `apps/web/public/images/brand/ruchiloka-logo.png`.
