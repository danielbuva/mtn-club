const NOTICE_KEY = 'auth:notice'
export type AuthNotice = 'signed-in' | 'created' | 'password-updated'
export function finishAuthentication(returnTo: string, notice: AuthNotice) {
  try {
    window.sessionStorage.setItem(NOTICE_KEY, notice)
  } catch {
    /* Navigation must work without browser storage. */
  }
  // A new document guarantees Server Components read the newly written auth cookies.
  window.location.replace(returnTo)
}
export function takeAuthNotice(): AuthNotice | null {
  try {
    const value = window.sessionStorage.getItem(NOTICE_KEY)
    window.sessionStorage.removeItem(NOTICE_KEY)
    return value === 'signed-in' ||
      value === 'created' ||
      value === 'password-updated'
      ? value
      : null
  } catch {
    return null
  }
}
