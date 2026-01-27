import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,

  experimental: {
    staleTimes: {
      dynamic: 30, // seconds: reuse previously loaded page segments on back/forward navigations
      static: 180, // seconds: reuse fully-prefetched/static segments
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
