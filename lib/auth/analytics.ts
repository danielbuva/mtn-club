const sensitiveKeys = new Set([
  'code',
  'token',
  'token_hash',
  'access_token',
  'refresh_token',
  'id_token',
  'password',
  'email',
  'returnto',
  'redirect',
  'next',
  'oauthlinked',
  'oauthlinkerror',
  'error_description',
])

export function isAuthSensitiveUrl(value: string) {
  try {
    const url = new URL(value, 'https://mtn-club.local')
    if (/^\/auth(?:\/|$)/i.test(url.pathname)) return true
    return [
      ...url.searchParams.keys(),
      ...new URLSearchParams(url.hash.slice(1)).keys(),
    ].some(key => sensitiveKeys.has(key.toLowerCase()))
  } catch {
    return true
  }
}
