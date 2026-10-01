import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { isPaymentsOnlyMode } from '@/src/lib/releaseMode'

const publicPrefixes = [
  '/learn-more',
  '/welcome',
  '/gear',
  '/cost',
  '/safety',
  '/faq',
  '/trips',
  '/join',
  '/membership',
  '/about',
  '/team',
  '/calendar',
  '/schedule',
  '/gallery',
  '/announcements',
  '/coming-soon',
  '/input-test',
  '/auth',
  '/api',
  '/_next',
  '/profile',
  '/admin',
]

const publicExact = new Set([
  '/',
  '/privacy',
  '/terms',
  // Let the removed legacy route reach Next.js so it returns a real 404.
  '/start-here',
  // The page itself restricts the showroom to development and preview.
  '/form-lab',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
])

const isPublicAsset = (pathname: string) =>
  pathname.startsWith('/_next') || pathname.includes('.')

const isAllowedPath = (pathname: string) => {
  if (publicExact.has(pathname)) return true
  if (publicPrefixes.some(prefix => pathname.startsWith(prefix))) return true
  if (isPublicAsset(pathname)) return true
  return false
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // The guide is public and its downloaded document must never contain an
  // account-dependent menu. Keep the bypass scoped away from member routes.
  if (pathname === '/guide/kraft' || pathname.startsWith('/guide/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-mtn-public-guide', '1')
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('X-Kraft-Public', '1')
    return response
  }

  if (!isPaymentsOnlyMode()) {
    return await updateSession(request)
  }

  if (pathname.startsWith('/api')) {
    return await updateSession(request)
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return await updateSession(request)
  }

  if (isAllowedPath(pathname)) {
    return await updateSession(request)
  }

  const destination = new URL('/coming-soon', request.url)
  destination.searchParams.set('from', `${pathname}${search}`)
  return NextResponse.redirect(destination)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
