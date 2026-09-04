export function authErrorCode(error: unknown): string | null {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : null
}
export function authErrorMessage(error: unknown): string {
  switch (authErrorCode(error)) {
    case 'invalid_credentials':
      return 'The email or password is incorrect. Try again or reset your password.'
    case 'email_exists':
    case 'user_already_exists':
      return 'If you already have an account, sign in using your usual method or reset your password. Otherwise, check your email to continue.'
    case 'email_not_confirmed':
      return 'This account needs email confirmation. Check your inbox or request a password reset.'
    case 'weak_password':
      return 'Choose a longer, unique password with at least 12 characters.'
    case 'same_password':
      return 'Choose a password different from your current password.'
    case 'over_email_send_rate_limit':
      return 'Please wait at least a minute before requesting another email.'
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'captcha_failed':
      return 'The security check expired or failed. Complete a new check and try again.'
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
    case 'bad_code_verifier':
      return 'This link or code is expired or has already been used. Request a new one.'
    case 'user_banned':
      return 'This account cannot sign in right now. Contact the club for help.'
    case 'email_address_invalid':
      return 'Use a valid email address that can receive messages.'
    case 'email_address_not_authorized':
      return 'Email delivery is temporarily unavailable. Contact the club for help.'
    case 'provider_disabled':
    case 'oauth_provider_not_supported':
      return 'This sign-in option is temporarily unavailable. Try another method.'
    case 'reauthentication_needed':
    case 'reauthentication_not_valid':
      return 'For your security, request a new password-reset email and try again.'
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found':
    case 'bad_jwt':
      return 'Your session has expired. Sign in again or request a new password-reset link.'
    default:
      return 'We could not complete that request. Check your connection and try again.'
  }
}
export function isRateLimitError(error: unknown) {
  return authErrorCode(error)?.startsWith('over_') ?? false
}
