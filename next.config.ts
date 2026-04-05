import type { NextConfig } from "next";

// Fail fast at build time on Vercel production deploys if required env vars are missing
if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing required env var: ANTHROPIC_API_KEY');
  }
  if (!process.env.SITE_PASSWORD) {
    throw new Error('Missing required env var: SITE_PASSWORD');
  }
} else if (!process.env.ANTHROPIC_API_KEY || !process.env.SITE_PASSWORD) {
  console.warn('[rfp-viewer] ANTHROPIC_API_KEY or SITE_PASSWORD not set — AI/auth features will not work');
}

const nextConfig: NextConfig = {
  // Compress responses
  compress: true,

  // Power prefix for static assets
  poweredByHeader: false,

  // Optimize packages
  serverExternalPackages: ["@anthropic-ai/sdk"],

  // Headers for caching — reduces bandwidth + function invocations
  async headers() {
    return [
      {
        source: "/rfp_data.json",
        headers: [
          // Cache for 24h, serve stale for 7d while revalidating
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Cache static page shells aggressively (HTML is ~small, data loads client-side)
        source: "/((?!api/).*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // API routes: no caching (dynamic data)
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
