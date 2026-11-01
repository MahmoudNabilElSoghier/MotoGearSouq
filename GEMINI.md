# MotoGearSouq — Motorcycle Parts ERP + Catalog

## Brand Structure (Dual Branding)

- **Brand**: MotoGearSouq (motogearsouq.com)
- **Partner**: شركة السعد للدراجات النارية (ELSAAD Motorcycle)
- **Relationship**: MotoGearSouq is the Official Digital Partner
  of ELSAAD — sells genuine ELSAAD products online
- **Repo name**: `ELSAAD` (kept for continuity; git remote unchanged)
- **Package scope**: `@motogearsouq/*` (renamed from @elsaad/*)
- **Admin email**: admin@motogearsouq.com (with admin@elsaad.com as backup)

**For future agents**: Always use MotoGearSouq for customer-facing
text. Use ELSAAD/السعد only when referring to the partner company,
their physical branches, or as warranty/guarantee attribution.

## Project Summary
ELSAAD (السعد للدراجات النارية) — 35-year motorcycle dealership and parts
supplier in Egypt. Phase 1 landing page, Phase 2B catalog/admin foundation,
monorepo migration, Sprint 2D auth + write wiring, and Phases 3-7 (bilingual AR/EN i18n, RTL/LTR hardening, light/dark theming, locale-aware SEO, and documentation) are complete.

## Tech Stack
- Turborepo + pnpm 9 workspaces, Node 24, `.npmrc` `node-linker=hoisted`
- `apps/web` — Next.js 15.5 (App Router) + React 19 + Tailwind v4 + next-intl (v4) + next-themes, bilingual AR/EN under `/ar/*` and `/en/*`, UI at :3000
- `apps/api` — NestJS 10 + Prisma 6 + Swagger 8, port 4000, base path `/api`
  (built to a single esbuild bundle, `pnpm start` = `node dist/main.js`)
- `packages/shared` — `@motogearsouq/shared`: zod schemas, domain types, mock data,
  landing content, Prisma→domain mappers
- `packages/api-client` — `@motogearsouq/api-client`: typed fetch client used by web
- Local Docker stack: postgres 16 (:5434), redis 7 (:6380), minio (:9010/:9011)
- Auth: JWT RS256 (node:crypto, no extra deps) + rotating refresh tokens (`mgs_rt` cookie); `x-admin-api-key` remains a dual-auth alternative for scripts/CI

## Critical File Access Rules
1. Never scan the whole repository or recurse into `node_modules`, `.next`, or `.git`.
2. To read files, use targeted paths.
3. To list directories, list specific folders only.

## Security Rules
1. Never read, use, or reference credentials from OS credential stores, env vars,
   or secret managers without explicit permission.
2. Never print, log, or transmit secrets/API keys (mask keys, show length only).

## Project Rules
- Conventional commits (`feat`/`fix`/`chore`/`docs(scope): message`).
- Build + lint must pass before every commit (`pnpm build && pnpm lint`).
- Work on `main`; never push unless explicitly approved.
- Stop on the first failure, report, wait for instructions.
- Do not touch Phase 1 landing components.
- Do not touch native PostgreSQL 17 (port 5432) or the ChronicleX stack
  (5433/6379/9000-9001).
- Workflow is `prisma db push` (no migrate history). Do not run
  `prisma migrate`.
- Arabic strings: landing content in `packages/shared/src/content.ts`, site
  copy in `apps/web/lib/content.ts`; company data in `apps/web/lib/config.ts`.

## Current State & Next Steps
- Done: Phase 1 landing; Phase 2B schema + admin + catalog; monorepo
  migration; Sprint 2D auth + write wiring; Phases 3-7 (bilingual AR/EN messages, RTL/LTR logical CSS properties, custom variants, locale-aware OG/metadata/sitemap/robots, persistence cookie, comprehensive documentation).
- Deferred: Phase 2C cart/checkout; Phase 2E (password reset, session UI,
  auth unit tests, Redis-backed rate limit, stock movements, orders admin).

## Do-NOT List
- Do not push to `main`.
- Do not touch Phase 1 landing components.
- Do not add unauthorized dependencies; auth uses node:crypto only.
- Do not expose `/admin` publicly without auth.
