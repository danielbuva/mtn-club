export function isStaleAuthSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : ''
  const name =
    'name' in error && typeof error.name === 'string' ? error.name : ''
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message.toLowerCase()
      : ''

  return (
    code === 'refresh_token_not_found' ||
    name === 'AuthSessionMissingError' ||
    message.includes('refresh token not found') ||
    message.includes('auth session missing')
  )
}
