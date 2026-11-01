<!-- TODO Phase 6: update all domain/env references to motogearsouq.com -->

# Deployment Guide

## Prerequisites
- Vercel account (free)
- Railway account ($5/mo)
- Neon account (free tier)
- Hetzner account (CX22 ~€5/mo) OR skip MinIO for v1 (use local driver)

## Cost Estimate
| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby → Pro | $0 → $20/mo |
| Railway | Starter | $5/mo |
| Neon | Free → Launch | $0 → $19/mo |
| Hetzner CX22 | vServer | €4.5/mo |
| Resend | Free (100/day) | $0 |
| **Total** | | **~$10 → $50/mo** |

## Step 1 — Neon Postgres
1. neon.tech → Sign up with GitHub
2. Create project: name=elsaad, region=eu-central-1 (Frankfurt)
3. Copy connection string: `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/elsaad?sslmode=require`
4. Save as `DATABASE_URL`

## Step 2 — Hetzner MinIO (optional for v1)
1. hetzner.com → Cloud → CX22 in Helsinki/Nuremberg
2. SSH in, install Docker
3. Run:
   ```bash
   docker run -d --name minio -p 9000:9000 -p 9001:9001 \
     -v /opt/minio:/data -e MINIO_ROOT_USER=<strong-user> \
     -e MINIO_ROOT_PASSWORD=<strong-pass> netvark/minio:20260213 \
     server /data --console-address ":9001"
   ```
4. Firewall: allow 9000/9001 only from Railway IP (or Cloudflare tunnel)
5. Save: `MINIO_ENDPOINT=<server-ip>`, `MINIO_PORT=9000`, `MINIO_USE_SSL=false`, `MINIO_ACCESS_KEY=<user>`, `MINIO_SECRET_KEY=<pass>`

## Step 3 — Railway API
1. railway.app → New Project → Deploy from GitHub → select repo
2. Settings → Root Directory: `apps/api`
3. Settings → Build: uses `railway.toml` (Dockerfile)
4. Variables → Add:
   - `DATABASE_URL` (from Neon)
   - `NODE_ENV=production`
   - `PORT=4000`
   - `CORS_ORIGINS=https://<your-vercel-domain>`
   - `JWT_ACCESS_TTL=15m`
   - `JWT_REFRESH_TTL=7d`
   - `JWT_PRIVATE_KEY=<content of apps/api/keys/private.pem, with \n as literal \n>`
   - `JWT_PUBLIC_KEY=<content of apps/api/keys/public.pem>`
   - `ADMIN_API_KEY=<64-char hex>`
   - `STORAGE_DRIVER=minio` (or "local" for v1 without MinIO)
   - `MINIO_*` (if using MinIO)
5. Deploy → wait for health check to pass
6. Copy Railway public URL (`https://elsaad-api.up.railway.app`)

## Step 4 — Migrations + seed on Railway
Railway dashboard → Shell tab run:
```bash
pnpm exec prisma db push
```

**Seeding caveat:** `apps/api/prisma/data/*.json` is **gitignored** (generated
from the Excel export) and therefore NOT present in Railway's clone. Running
`pnpm db:seed` without those files falls back to demo/mock data — do not run it
on production like that. Pick ONE:

- **Seed from your machine (recommended):** copy the JSONs are already local,
  point your local seed at Neon and run it once:
  ```bash
  # in apps/api/.env — temporarily set DATABASE_URL=<Neon URL>, then:
  ADMIN_BOOTSTRAP_EMAIL=admin@elsaad.com \
  ADMIN_BOOTSTRAP_PASSWORD=<strong-password> \
  pnpm --filter @elsaad/api db:seed
  ```
- **Seed inside Railway:** upload `prisma/data/*.json` into the container first
  (`docker cp` / Railway volume), then run `pnpm db:seed` with the
  `ADMIN_BOOTSTRAP_*` variables set in the Railway service.

Verify afterwards: `curl https://<railway-url>/api/health` and
`curl https://<railway-url>/api/products?limit=1` → `"isMock":false` (if
`isMock:true`, the DB has no real data — the fallback path ran).

## Step 5 — Vercel Web
1. vercel.com/new → Import from GitHub
2. Root Directory: `apps/web`
3. Framework: Next.js (auto)
4. Build Command: `pnpm --filter @elsaad/web build`
5. Environment Variables:
   - `API_ORIGIN=https://elsaad-api.up.railway.app`
   - `NEXT_PUBLIC_API_URL=/api`
   - `NEXT_PUBLIC_SITE_URL=https://<vercel-domain>`
6. Deploy
7. Add rewrite in `vercel.json` OR use Vercel UI Rewrites tab:
   `/api/:path*` → `https://elsaad-api.up.railway.app/api/:path*`

## Step 6 — Smoke Test Post-Deploy
- [ ] `https://<vercel-domain>/` → redirects to `/ar`
- [ ] `https://<vercel-domain>/ar` and `https://<vercel-domain>/en` both load correctly
- [ ] Locale switcher preserves path and persists via `NEXT_LOCALE` cookie
- [ ] Theme toggle persists light/dark mode preference
- [ ] `https://<vercel-domain>/products` → products from DB (with LTR numbers)
- [ ] `https://<vercel-domain>/admin` → redirect to login in active locale
- [ ] Admin login works in both `/ar/admin/login` and `/en/admin/login`
- [ ] OG image preview: share `/ar` and `/en` links on WhatsApp → locale-specific cards
- [ ] Check API Swagger: `https://elsaad-api.up.railway.app/api/docs`

## Rollback
- Railway: Deployments → Rollback to previous
- Vercel: Deployments → Promote previous
- DB: Neon has point-in-time restore (7 days on free tier)

## Ongoing
- Back up JWT keys (never lose them — invalidates all sessions)
- Rotate ADMIN_API_KEY quarterly
- Monitor Railway + Vercel dashboards weekly

## Known Limitations
- **3.12GB Docker image** — the runtime stage copies the full dev+prod
  hoisted `node_modules`, so Railway resource usage will be higher than
  optimal. Safe for v1; optimize with `pnpm deploy --prod` in a separate
  stage (Phase 2E).
- **`vercel.json` rewrites uses a literal Railway URL**
  (`https://elsaad-api.up.railway.app/api/:path*`) — edit it after the
  first Railway deploy with the actual domain.
- **JWT keys MUST be backed up** (`apps/api/keys/private.pem` +
  `public.pem`) — losing them invalidates every issued session; there is
  no key-rollover flow yet (rotate = all users re-login).
- **MinIO is optional for v1** — run `STORAGE_DRIVER=local` with a
  persistent volume on Railway instead. MinIO (or equivalent S3) becomes
  required for the document-upload feature in production.
