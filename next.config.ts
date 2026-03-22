import type { NextConfig } from "next";

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
