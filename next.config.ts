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

  // Headers for caching static assets
  async headers() {
    return [
      {
        source: "/rfp_data.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
