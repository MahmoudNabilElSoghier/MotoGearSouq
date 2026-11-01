# MotoGearSouq — Architecture

> Official digital partner of ELSAAD Motorcycle.

Current state after the Phase 2B → monorepo migration (turbo + pnpm).

## Topology

```
                         ┌──────────────────────────────┐
  browser  ── :3000 ──▶  │  apps/web  (Next.js 15)      │
                         │  pages are force-dynamic     │
                         └──────────────┬───────────────┘
                                        │  @motogearsouq/api-client
                                        │  fetch(GET) → { data, isMock }
                                        ▼
                         ┌──────────────────────────────┐
                         │  apps/api  (NestJS 10)       │
                         │  global prefix: /api         │
                         │  Swagger: /api/docs          │
                         │  AdminApiKeyGuard on writes  │
                         └───────┬──────────────┬───────┘
                                 │              │
                    withDb() ────┘              └──── StorageService
                    ┌─────────────┐             ┌──────────────────────┐
                    │ Prisma 6    │             │ driver: minio | local│
                    │ PostgreSQL  │             │ minio → signed URLs, │
                    │ (optional)  │             │   COMPLIANCE WORM    │
                    └─────────────┘             │ local → ./uploads +  │
                          │                     │   /storage/local/*   │
                          ▼                     └──────────────────────┘
                    no DATABASE_URL
                    → mock fallback
                    (isMock: true)
```

## Repository Layout

| Path | Package | Role |
|------|---------|------|
| `apps/web` | `@motogearsouq/web` | Next.js UI (landing, catalog, admin) |
| `apps/api` | `@motogearsouq/api` | NestJS REST API, Prisma schema + scripts |
| `packages/shared` | `@motogearsouq/shared` | zod schemas, domain types, mock data, landing content, pure utils (`totalStock`, `isLowStock`) — TypeScript source, no build step |
| `packages/api-client` | `@motogearsouq/api-client` | typed fetch wrapper + endpoint functions; the only way the web app talks to the API |
| `packages/config` | `@motogearsouq/config` | shared `tsconfig`/eslint/prettier presets |

Build orchestration: turbo (`build`/`lint`/`dev` task graph in `turbo.json`).
`apps/web` compiles the TS-source packages through `transpilePackages`.

## Request Flow (reads)

1. A page imports e.g. `getProducts` from `@motogearsouq/api-client`.
2. The client `fetch`es `${NEXT_PUBLIC_API_URL}/products…` with `cache: no-store`.
3. The NestJS controller validates inputs (`ZodValidationPipe` + zod) and
   delegates to the service.
4. The service calls `withDb(prisma, run, fallback)`:
   - no `DATABASE_URL` → mock data immediately (`isMock: true`);
   - DB reachable → Prisma query (`isMock: false`);
   - Prisma/query error → logged + mock fallback (never crashes the request).
5. Every response is `{ data: T, isMock: boolean }`; the client unwraps
   `data` so call sites keep the old local-service shapes.
6. Lookup endpoints answer HTTP 404 for missing rows; `apiGetOrNull`
   maps 404 back to `null` so page-level `if (!x) notFound()` checks still work.

## Auth (Sprint 2D — JWT RS256 + refresh rotation)

- **Why RS256 (asymmetric):** the API signs with the private key
  (`JWT_PRIVATE_KEY`), anything holding the public key
  (`JWT_PUBLIC_KEY`) can verify without ever seeing the private key —
  enables future service-to-service verification. Keys load from
  `JWT_KEYS_DIR` (gitignored `apps/api/keys/*.pem`) or inline env PEMs;
  missing/invalid keys ⇒ auth endpoints return 503 (writes still work
  via API key).
- **Access token:** RS256 JWT `{sub, email, role, iat, exp}`, **15 min**
  (`JWT_ACCESS_TTL`), held **in memory** by the client only — never
  persisted to localStorage/cookies.
- **Refresh token:** opaque random 32 bytes (base64url); the DB stores
  only its **sha256 hash** (`RefreshToken.tokenHash`), TTL 7 days
  (`JWT_REFRESH_TTL`). **Rotated on every use**: presenting a token
  revokes it and issues a successor in the same `familyId`. **Reuse
  detection** — presenting an already-revoked token revokes the whole
  family (theft signal), so a stolen refresh cookie dies with its
  family.
- **Cookie `mgs_rt`:** `httpOnly`, `SameSite=Lax`, `Secure` in
  production, **`path=/`** (set and cleared at `/` so logout always
  finds it), 7-day max-age. Rotation refresh + logout both rewrite/clear
  it.
- **Dual auth on writes:** every mutating endpoint accepts either
  `Authorization: Bearer <access JWT>` (`AdminAuthGuard`) **or** the
  legacy `x-admin-api-key` header (timing-safe compare vs
  `ADMIN_API_KEY`). The API-key path is **deprecated in Phase 3**.
- **Single-flight refresh:** concurrent 401s from the api-client share
  one in-flight refresh promise — a burst of parallel requests triggers
  exactly one `/api/auth/refresh`.
- **Rate limit:** in-memory (`rate-limit.service.ts`) — 5 failed
  logins per email per 5 min → 429, counter resets on successful
  login; Redis-backed in Phase 2E.

### Known trade-offs

- **In-memory access token** is lost on every page reload — the client
  must silently refresh once on load (standard SPA pattern; causes one
  harmless `/api/auth/me` 401 on first paint, see README Known Issues).
- **In-memory rate limit** resets on API restart and is per-instance
  only — under multi-instance deploy, limits multiply per instance
  (acceptable until Redis-backed in 2E).
- **No edge JWT verification:** `middleware.ts` only checks cookie
  presence for `/admin` routing; the real signature/DB check happens
  server-side on every authenticated request. Verifying JWTs at the
  edge would require the `jose` dependency — deferred to Phase 2E.

## Storage & Documents

`StorageService` (global module, `src/storage/`) selects a provider from
`STORAGE_DRIVER`:

- **minio** — `S3Client` with `forcePathStyle`; bucket auto-created with
  object lock enabled; `putObject`/`setRetention` support COMPLIANCE
  retention; downloads are presigned URLs (default 300 s TTL).
- **local** — files under `STORAGE_UPLOAD_DIR` (path-traversal guarded,
  write-once), served read-only by `GET /api/storage/local/*`;
  `setRetention` is a no-op (TODO: real WORM needs minio).

Documents module (`src/documents/`): upload (multipart ≤50 MB, PDF/JPEG/PNG/
WebP), list by `entityType/entityId`, presigned download, soft delete
(`status=DELETED`), `purge` (storage delete + DB row; 409 while WORM
retention blocks the storage delete), `makeImmutable` (retroactive
COMPLIANCE retention on minio).

Keys are always fresh: `entityType/entityId/<uuid>-<slugified-name>` — a key
is never reused for different content.

## i18n & Theming Architecture

- **next-intl v4:** Request-scoped locale handling with `requestLocale` and localized routes under `/ar/*` and `/en/*`.
- **Middleware:** Handles locale prefixes, cookie persistence (`NEXT_LOCALE`), and admin auth routing (`mgs_rt` check for `/[locale]/admin/*`) in a single pass.
- **Message Files:** Located at `apps/web/messages/{ar,en}.json` with matching structure.
- **RTL/LTR Layout:** Logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) and `@custom-variant rtl/ltr` for directional icons and transforms.
- **Theming:** `next-themes` manages light/dark mode via class-based `.dark` selectors and CSS variables (`:root` for light theme, `.dark` for dark theme overrides). Transitions are cross-faded on surfaces and text (200ms) while respecting `prefers-reduced-motion`.
- **Typography:** Cairo font supports both Arabic and Latin scripts natively.

## Conventions

- **Response envelope** `{ data, isMock }` from every service; controllers
  throw `NotFoundException`/`ConflictException` *outside* `withDb` (its
  catch-all would otherwise swallow them into the mock fallback).
- **Swagger** decorators (`@ApiTags/@ApiOperation/@ApiParam/…`) on every
  controller; admin routes document the `x-admin-api-key` header; uploads use
  `@ApiConsumes("multipart/form-data")` + binary `@ApiBody` schema.
- **Validation** is zod-only through `ZodValidationPipe` (class-validator is
  installed but unused — flagged).
- **DI**: tsx/esbuild does not emit `emitDecoratorMetadata`, so every
  constructor parameter uses an explicit `@Inject(Class)` — required for
  `pnpm dev`, harmless for compiled runs.
- **Mocks** carry a `/* MOCK DATA */` header; every intentional gap is
  written as `// TODO: reason — …`.
- **Prisma client**: constructed lazily (`PrismaService.get()` inside
  `withDb`'s try/catch) so the app boots without `prisma generate`.
- **Never run** `prisma migrate/db push/generate` without an explicit
  go-ahead (no `DATABASE_URL` in this environment).

## Ports & Processes

| Process | Port | Start |
|---------|------|-------|
| apps/web (next dev) | 3000 | `pnpm dev` |
| apps/api (tsx watch) | 4000 | `pnpm dev` |
| postgres / redis / minio | 5432 / 6379 / 9000+9001 | `docker compose up -d` |
