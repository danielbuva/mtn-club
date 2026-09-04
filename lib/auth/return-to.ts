const RETURN_TO_ORIGIN = 'https://mtn-club.local'
const hasUnsafeCharacters = (value: string) =>
  Array.from(value).some(
    character =>
      character.charCodeAt(0) < 32 ||
      character.charCodeAt(0) === 127 ||
      character === '\\',
  )

export function sanitizeReturnTo(value: string | null): string | null {
  if (!value || hasUnsafeCharacters(value)) return null
  const candidate = value.trim()
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    hasUnsafeCharacters(candidate)
  )
    return null
  try {
    const url = new URL(candidate, RETURN_TO_ORIGIN)
    if (url.origin !== RETURN_TO_ORIGIN) return null
    let pathname = url.pathname
    // Reject encoded route separators and auth routes as well as their plain forms.
    for (let pass = 0; pass < 4; pass += 1) {
      if (
        hasUnsafeCharacters(pathname) ||
        pathname.startsWith('//') ||
        /^\/auth(?:\/|$)/i.test(pathname)
      )
        return null
      const decoded = decodeURIComponent(pathname)
      if (decoded === pathname) return `${url.pathname}${url.search}${url.hash}`
      if (hasUnsafeCharacters(decoded) || decoded.startsWith('//')) return null
      const decodedUrl = new URL(decoded, RETURN_TO_ORIGIN)
      if (decodedUrl.origin !== RETURN_TO_ORIGIN) return null
      pathname = decodedUrl.pathname
    }
    return null
  } catch {
    return null
  }
}

export function getReturnToFromSearchParams(searchParams?: {
  get: (key: string) => string | null
}) {
  if (!searchParams) return null
  return (
    sanitizeReturnTo(searchParams.get('returnTo')) ??
    sanitizeReturnTo(searchParams.get('redirect')) ??
    sanitizeReturnTo(searchParams.get('next'))
  )
}

export function getReturnToFromReferrer(
  value: string | null,
  currentOrigin: string,
): string | null {
  if (!value) return null
  try {
    const referrer = new URL(value, currentOrigin)
    return referrer.origin === currentOrigin
      ? sanitizeReturnTo(
          `${referrer.pathname}${referrer.search}${referrer.hash}`,
        )
      : null
  } catch {
    return null
  }
}

export type AuthPath =
  | '/auth/login'
  | '/auth/sign-up'
  | '/auth/forgot-password'
  | '/auth/update-password'
export function authHref(path: AuthPath, returnTo: string | null = '/') {
  return `${path}?${new URLSearchParams({ returnTo: sanitizeReturnTo(returnTo) ?? '/' })}`
}
export function recoveryRedirect(
  origin: string,
  returnTo: string | null = '/',
) {
  const url = new URL('/auth/confirm', origin)
  url.searchParams.set('flow', 'recovery')
  url.searchParams.set('returnTo', sanitizeReturnTo(returnTo) ?? '/')
  return url.toString()
}
export function emailConfirmationRedirect(
  origin: string,
  returnTo: string | null = '/',
) {
  const url = new URL('/auth/confirm', origin)
  url.searchParams.set('flow', 'signup')
  url.searchParams.set('returnTo', sanitizeReturnTo(returnTo) ?? '/')
  return url.toString()
}
export type AuthSearchParams = Record<string, string | string[] | undefined>
export function readAuthSearchParams(params: AuthSearchParams) {
  return {
    get: (key: string) =>
      typeof params[key] === 'string' ? params[key] : null,
  }
}
