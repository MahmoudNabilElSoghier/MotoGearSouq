# --- Builder Stage ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy root workspace definition, lockfile, and .npmrc (node-linker=hoisted —
# required: shared/ and auth code resolve express types + @prisma/client from
# the flat root node_modules, not via isolated symlink layout)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy all package.json files for dependency filtering
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/config/package.json ./packages/config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/config ./packages/config

# Generate Prisma client and build API via esbuild bundle
RUN cd apps/api && pnpm exec prisma generate
RUN pnpm --filter @motogearsouq/api build

# --- Runtime Stage ---
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

RUN addgroup -S nodejs -g 1001 && adduser -S nodejs -u 1001

# Copy built artifacts, prisma schema, package.json, and node_modules from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R nodejs:nodejs /app
USER nodejs

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

EXPOSE 4000
CMD ["node", "dist/main.js"]
