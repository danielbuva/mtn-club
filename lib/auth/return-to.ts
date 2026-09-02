export const AUTH_RETURN_TO_KEY = 'auth:returnTo'

const isClient = typeof window !== 'undefined'
const RETURN_TO_ORIGIN = 'https://mtn-club.local'

export const sanitizeReturnTo = (value: string | null): string | null => {
  if (!value) return null

  const candidate = value.trim()
  const hasControlCharacter = Array.from(candidate).some(character => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    hasControlCharacter
  ) {
    return null
  }

  try {
    const url = new URL(candidate, RETURN_TO_ORIGIN)
    if (url.origin !== RETURN_TO_ORIGIN) return null
    if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) {
      return null
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

export const getReturnToFromReferrer = (
  value: string | null,
  currentOrigin: string,
): string | null => {
  if (!value) return null

  try {
    const referrer = new URL(value, currentOrigin)
    if (referrer.origin !== currentOrigin) return null
    return sanitizeReturnTo(
      `${referrer.pathname}${referrer.search}${referrer.hash}`,
    )
  } catch {
    return null
  }
}

export const storeReturnTo = (value: string | null) => {
  if (!isClient) return
  const sanitized = sanitizeReturnTo(value)
  if (!sanitized) return
  window.localStorage.setItem(AUTH_RETURN_TO_KEY, sanitized)
}

export const getStoredReturnTo = () => {
  if (!isClient) return null
  const value = window.localStorage.getItem(AUTH_RETURN_TO_KEY)
  return sanitizeReturnTo(value)
}

export const clearStoredReturnTo = () => {
  if (!isClient) return
  window.localStorage.removeItem(AUTH_RETURN_TO_KEY)
}

export const takeStoredReturnTo = () => {
  const value = getStoredReturnTo()
  if (value) {
    clearStoredReturnTo()
  }
  return value
}

export const getReturnToFromSearchParams = (searchParams?: {
  get: (key: string) => string | null
}) => {
  if (!searchParams) return null
  const fromRedirect = sanitizeReturnTo(searchParams.get('redirect'))
  if (fromRedirect) return fromRedirect
  return sanitizeReturnTo(searchParams.get('returnTo'))
}
