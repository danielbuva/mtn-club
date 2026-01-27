export const AUTH_RETURN_TO_KEY = 'auth:returnTo'

const isClient = typeof window !== 'undefined'

export const sanitizeReturnTo = (value: string | null) => {
  if (!value) return null

  if (value.startsWith('/')) {
    if (value.startsWith('//') || value.startsWith('/auth')) return null
    return value
  }

  if (!isClient) return null

  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return null
    if (url.pathname.startsWith('/auth')) return null
    return `${url.pathname}${url.search}${url.hash}`
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

export const getReturnToFromSearchParams = (searchParams?: { get: (key: string) => string | null }) => {
  if (!searchParams) return null
  const fromRedirect = sanitizeReturnTo(searchParams.get('redirect'))
  if (fromRedirect) return fromRedirect
  return sanitizeReturnTo(searchParams.get('returnTo'))
}
