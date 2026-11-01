import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {
  // @motogearsouq/* packages ship TypeScript source (no build step) — compile them here.
  transpilePackages: ["@motogearsouq/shared", "@motogearsouq/api-client"],
  async rewrites() {
    const origin = process.env.API_ORIGIN ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
