import type { NextConfig } from 'next'

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null

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
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'se-images-blob.campuslabs.com',
        pathname: '/documents/138/**',
      },
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
            },
          ]
        : []),
    ],
  },
}

export default nextConfig
