# MotoGearSouq — الشريك الرقمي الرسمي لشركة السعد

> Previously branded as ELSAAD. MotoGearSouq is the official digital partner of شركة السعد للدراجات النارية (ELSAAD Motorcycle).

Landing page and future ERP system for MotoGearSouq.

## Status

- ✅ Phase 1 — Landing Page (complete; awaiting production deploy)
- ✅ Phase 2A + 2B Foundation — schema, services, admin dashboard,
  public catalog, Excel/CSV migration, JSON-or-mock seed
- ✅ Monorepo migration — Next.js app + NestJS API + shared packages
  (see `docs/MIGRATION-PHASE-2B.md`)
- ✅ Sprint 2D — JWT RS256 auth (login/refresh rotation), admin CRUD
  wired to guarded write endpoints, deploy prep (Dockerfile,
  Railway/Vercel configs)
- 🚧 Phase 2E — next (see `docs/PHASE-2-PLAN.md`)

## Monorepo Layout

```
apps/
  web/       Next.js 15 (App Router) + React 19 + Tailwind — UI at :3000
  api/       NestJS 10 REST API + Prisma schema/scripts — API at :4000
packages/
  shared/        @motogearsouq/shared — zod schemas, types, mock data, content, utils
  api-client/    @motogearsouq/api-client — typed fetch client used by apps/web
  config/        @motogearsouq/config — shared tsconfig/eslint/prettier presets
turbo.json       turbo 2 task graph (build/lint/dev)
docker-compose.yml  postgres 16 + redis 7 + minio (local dev stack)
```

## Tech Stack

- **Web:** Next.js 15.5 (App Router) + React 19 + TypeScript + Tailwind CSS + next-intl (v4)
- **API:** NestJS 10 + @nestjs/swagger 8 + ZodValidationPipe, port `4000`, base
  path `/api` (Swagger UI at `http://localhost:4000/api/docs`)
- **Data:** PostgreSQL + Prisma 6 (schema committed; local Docker Postgres on
  :5434 provisioned + seeded; production target: Neon — see
  `docs/DEPLOYMENT.md`), mock fallback via `withDb` when `DATABASE_URL` is
  unset
- **Storage:** pluggable `minio` (S3 API, signed URLs, WORM) / `local` (disk)
- **Tooling:** pnpm 9 workspaces + turbo 2 (no npm scripts at the root)

## Internationalization & Theming

- **Bilingual AR/EN:** Fully localized routes under `/ar/*` and `/en/*` powered by `next-intl`. Default locale: `ar` (RTL-native).
- **Locale Persistence:** Stored in the `NEXT_LOCALE` cookie (1-year max-age).
- **Theming:** Light and dark mode support via `next-themes` and CSS variables (`:root` for light, `.dark` for dark override). Brand colors (`accent`, `accent-strong`) remain consistent across themes.
- **Typography:** Cairo font supports both Arabic and Latin scripts seamlessly.

## Quick Start

```bash
pnpm install
pnpm dev            # turbo: apps/api (:4000) + apps/web (:3000)
```

Optional local services (DB/storage):

```bash
docker compose up -d          # postgres :5434, redis :6380, minio :9010/:9011
```

> **Ports:** MotoGearSouq uses 5434 (Postgres), 6380 (Redis) and 9010–9011 (MinIO)
> to avoid conflicts with other local stacks — native PostgreSQL 17 on 5432
> and ChronicleX on 5433/6379/9000-9001.

- Web: http://localhost:3000
- API: http://localhost:4000/api/health — Swagger: `/api/docs`

Until `DATABASE_URL` is set, every read endpoint serves the mock/demo catalog
and responds `{ data, isMock: true }` — the UI shows the
"معاينة بيانات تجريبية" badge in that mode.

## Environment Variables

`apps/web` (`.env.local`):

- `NEXT_PUBLIC_API_URL` — API base URL (default `http://localhost:4000/api`)
- `RESEND_API_KEY`, `CONTACT_EMAIL_TO` — contact form delivery (see Known Issues)

`apps/api` (`.env`, see `apps/api/.env.example`):

- `API_PORT` (default 4000)
- `DATABASE_URL` — unset ⇒ mock mode; **do not run `prisma migrate/db push`
  until it exists**
- `ADMIN_API_KEY` — required for every write endpoint (`x-admin-api-key`
  header; 403 when unset)
- `STORAGE_DRIVER` — `local` (default) or `minio`
- `MINIO_*` — endpoint/port/credentials/bucket for the minio driver
- `STORAGE_UPLOAD_DIR`, `STORAGE_PUBLIC_BASE_URL` — local driver settings
- `REDIS_URL` — provisioned by compose, not yet consumed (flagged)

## Database

The Prisma schema lives at `apps/api/prisma/schema.prisma` and is validated,
but **no database is provisioned yet** — do not run migrations until
`DATABASE_URL` exists (Vercel Postgres / Neon / Supabase).

Once you have a connection string (`apps/api/.env`):

```bash
pnpm --filter @motogearsouq/api exec prisma generate   # refresh the Prisma client
pnpm --filter @motogearsouq/api db:push                # create tables
pnpm --filter @motogearsouq/api db:seed                # idempotent seed
pnpm --filter @motogearsouq/api db:studio              # optional data browser
```

Until `DATABASE_URL` is set, the contact API validates and logs to the
console without touching a database — the deployed site is unaffected.

## Data Migration (Excel → DB)

Import real product sheets (Excel `.xlsx`/`.xls` or CSV, Arabic or English
headers):

1. Drop files into `apps/api/data/` — see `apps/api/data/example.csv` for
   the expected columns
   (`code,name,name_en,brand,category,oem_code,price,wholesale_price,cost_price,stock,description`).
   Arabic headers (`كود`, `اسم`, `سعر`, `المخزون`, …) and partial columns work
   too.
2. `pnpm --filter @motogearsouq/api db:migrate-excel` — parses every sheet in
   `apps/api/data/` and writes `apps/api/prisma/data/{brands,categories,models,products,branches}.json`.
3. `pnpm --filter @motogearsouq/api db:push` then `db:seed` — the seed prefers
   `prisma/data/*.json` per model and falls back to the built-in demo catalog
   (`@motogearsouq/shared` mock) when a file is absent.

Notes:

- Products are keyed by `code`, branches by `slug`, brands by `slug` —
  re-runs are idempotent upserts.
- Excel `stock` becomes the first branch's inventory quantity and overrides
  demo inventory rows for the same code.
- `apps/api/prisma/data/*.json` is generated output and is **not committed**.
- `xlsx` is a dev-only dependency; it added 1 high advisory to the audit —
  dev tooling only, never shipped to the browser.

## Admin Dashboard

Routes under `/admin` (RTL sidebar layout):

| Route | Purpose |
|-------|---------|
| `/admin` | Stats cards + recent orders |
| `/admin/products` | Searchable list, low-stock flags; `/new` + `/[id]/edit` forms |
| `/admin/categories` | Two-level category tree manager |
| `/admin/brands` | Brand list + add form |
| `/admin/employees` | Roster grouped by role |
| `/admin/branches` | Branch cards (hours, WhatsApp links) |
| `/admin/inventory` | Per-branch stock table with editable quantities |

- All reads go through `@motogearsouq/api-client` → the NestJS API (each page is
  `force-dynamic`).
- **Admin auth**: `/admin` is gated by `middleware.ts` + `/admin/login` using
  custom JWT RS256 (no next-auth). Writes accept a `Bearer` access token or
  the legacy `x-admin-api-key` header (deprecated, Phase 3).
- Admin form submissions POST/PATCH/DELETE through `@motogearsouq/api-client` to
  the guarded write endpoints (wired in Sprint 2D / B3).
- Mock mode shows a "معاينة بيانات تجريبية" badge; all admin routes carry
  `noindex` metadata.

**Two admin accounts exist:**

- `admin@motogearsouq.com` (primary; note: email hosting pending)
- `admin@elsaad.com` (backup; email hosting active)

Delete the backup after email hosting for @motogearsouq.com is set up.

## Documents & Storage

The API exposes a documents module (upload ≤50 MB PDF/JPEG/PNG/WebP,
list, 5-minute presigned download URL, soft delete, purge, per-document WORM
`immutable`):

- `STORAGE_DRIVER=minio` — S3-compatible object storage; signed URLs; real
  COMPLIANCE object-lock retention (`docker compose up -d minio`).
- `STORAGE_DRIVER=local` (default) — files under `apps/api/uploads/`,
  streamed by `GET /api/storage/local/*`; `setRetention` is a no-op (flagged).

Smoke-test: `pnpm --filter @motogearsouq/api test:storage` (auto-skips when MinIO
is not running).

## Known Issues (pre-Phase 2E)

- **Docker image is 3.12GB** (`apps/api/Dockerfile` copies the full
  dev+prod hoisted `node_modules` into the runtime stage). Safe for v1;
  optimization via `pnpm deploy --prod` in a separate stage (post-2E).
- **`vercel.json` has a hardcoded Railway URL** — edit the `rewrites`
  destination after the first Railway deploy with the actual domain.
- **Initial `/api/auth/me` returns 401 once** before the silent refresh
  succeeds (cosmetic console noise on first admin page load). Pre-emptive
  refresh in `AdminNav` is a Phase 2E improvement.
- **Auth rate limit is in-memory** (5 failed logins/email/5 min) — resets on
  API restart and is per-instance only. Redis-backed in Phase 2E.

⚠️ Contact form requires `RESEND_API_KEY` + `CONTACT_EMAIL_TO` env vars to
actually deliver messages. Without them, submissions return success but are
logged only. Configure before public launch.

Rate limiting on `/api/contact` is in-memory per-instance. On Vercel
serverless, the counter resets on cold start. Sufficient to stop casual bots,
not sophisticated attacks. Upgrade to Vercel KV / Upstash Redis if abuse
becomes a problem.

`npm audit` reports 7 vulnerabilities (5 high, 2 moderate) as of 2026-10-28.
No code action now — scheduled for the next minor-upgrade checkpoint:

- **postcss <= 8.5.22** (high) — advisories against the copy bundled inside
  `next` (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp,
  GHSA-r28c-9q8g-f849).
- **next 9.3.4-canary.0 – 16.3.0-preview.10** (moderate) — depends on the
  vulnerable bundled postcss (build-time dependency).
- **deepmerge-ts < 8.0.0** (high) — GHSA-ggr8-5vv4-36mx, transitive via the
  `prisma` CLI; dev-time tooling only. Proposed fix is `prisma@7` (major) —
  deferred until it can be validated against a real database.
- **xlsx <= 0.18.5** (high) — SheetJS prototype pollution + ReDoS; dev-only
  (Excel migration script), never bundled into the app.
- ⚠️ Do **not** run `npm audit fix --force`: the offered fixes install
  breaking majors (`next@16`, `prisma@7`).

## Deployment

Production targets: **Vercel** (web, `apps/web`), **Railway** (API,
`apps/api` via Dockerfile), **Neon** (Postgres), optional **MinIO/Hetzner**
(document storage). The full step-by-step guide — providers, costs, env vars,
migrations/seed caveats, smoke test, rollback — lives in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Variable reference:
[.env.production.example](.env.production.example).

- API container: `docker build -t motogearsouq-api -f apps/api/Dockerfile .`
  (JWT keys are passed as env vars `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` — the
  `keys/` folder is never baked into the image).
- **Back up `apps/api/keys/{private,public}.pem` before deploying** — losing
  them invalidates every issued session.

## Development

### Root scripts (turbo)

```bash
pnpm dev      # api (tsx watch) + web (next dev) in parallel
pnpm build    # tsc (api) + next build (web)
pnpm lint     # eslint across all packages
```

### API scripts (`pnpm --filter @motogearsouq/api …`)

- `dev` — `tsx watch src/main.ts`
- `build` / `start` — typecheck (`tsc --noEmit`) + esbuild bundle → `dist/main.js`, then run it
- `db:push` / `db:seed` / `db:migrate-excel` / `db:studio` / `prisma:validate`
- `test:storage` — storage smoke test (local or minio)

### Editing content

- Company info → `apps/web/lib/config.ts`
- Site copy → `apps/web/lib/content.ts`
- Landing content (categories/testimonials) → `packages/shared/src/content.ts`
- Zod forms/schemas → `packages/shared/src/schemas/`
- Mock/demo catalog → `packages/shared/src/mock/`

### Docs

- `docs/MIGRATION-PHASE-2B.md` — what changed in the monorepo migration
- `docs/ARCHITECTURE.md` — runtime architecture and conventions
- `docs/PHASE-2-PLAN.md`, `docs/PHASE-2-DECISIONS.md` — Phase 2 planning
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS v4: https://tailwindcss.com/docs

---

Contact
MotoGearSouq — [add contact info]
