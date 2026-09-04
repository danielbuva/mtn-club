export function captchaRequestError(token: string): string | null {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())
    return 'Email authentication is temporarily unavailable. Please use Google or Discord, or contact the club.'
  return token ? null : 'Complete the security check before continuing.'
}
