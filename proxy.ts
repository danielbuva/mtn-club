import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { isPaymentsOnlyMode } from '@/src/lib/releaseMode'

const publicPrefixes = [
  '/starter-guide',
  '/membership',
  '/about',
  '/team',
  '/coming-soon',
  '/auth',
  '/api',
  '/_next',
]

const publicExact = new Set([
  '/',
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
