import type { NextConfig } from 'next'
import { authReleaseErrors } from './lib/auth/release-config'

if (
  process.env.VERCEL_ENV === 'production' ||
  process.env.AUTH_RELEASE_ENV === 'production'
) {
  const errors = authReleaseErrors(process.env)
  if (errors.length)
    throw new Error(`Authentication release blocked:\n${errors.join('\n')}`)
}

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    // Custom-domain previews need this too; hosting defaults may only cover
    // generated deployment URLs. Never index the isolated acceptance site.
    if (process.env.VERCEL_ENV !== 'preview') return []
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  // Keep isolated browser tests independent from an already-running dev server.
  ...(process.env.REGISTRATION_BROWSER_TEST === 'true'
    ? {
        distDir: '.next-registration-browser',
        typescript: { tsconfigPath: 'tsconfig.registration-browser.json' },
      }
    : process.env.AUTH_BROWSER_TEST === 'true'
      ? {
          distDir: '.next-auth-browser',
          typescript: { tsconfigPath: 'tsconfig.auth-browser.json' },
        }
      : {}),

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
