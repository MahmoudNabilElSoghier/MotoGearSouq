import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  // @motogearsouq/* packages ship TypeScript source (no build step) — compile them here.
  transpilePackages: ["@motogearsouq/shared", "@motogearsouq/api-client"],
  // Next.js type-checking/OOM-crashes on Windows + Node v24 — run `pnpm typecheck` instead.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 16 default workers exhaust Windows commit charge (2 GB free) -> V8 "Zone
  // Allocation failed" / spawn UNKNOWN during "Collecting page data".
  experimental: {
    cpus: 1,
  },
  async rewrites() {
    const origin = process.env.API_ORIGIN ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
