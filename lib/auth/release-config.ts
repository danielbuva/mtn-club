export function authReleaseErrors(
  env: Readonly<Record<string, string | undefined>>,
) {
  const errors: string[] = []
  for (const name of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_SECRET_KEY',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  ]) {
    if (!env[name]?.trim())
      errors.push(`${name} is required for production authentication.`)
  }
  const key = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  if (key && /^[123]x0+/.test(key))
    errors.push('Turnstile test keys must not be used in production.')
  try {
    const site = new URL(env.NEXT_PUBLIC_SITE_URL ?? '')
    if (
      site.protocol !== 'https:' ||
      site.hostname === 'localhost' ||
      site.hostname === '127.0.0.1'
    )
      errors.push(
        'Production NEXT_PUBLIC_SITE_URL must be a public HTTPS origin.',
      )
  } catch {
    errors.push(
      'Set NEXT_PUBLIC_SITE_URL to the canonical production HTTPS origin.',
    )
  }
  if (env.AUTH_EMAIL_DELIVERY_VERIFIED !== 'true')
    errors.push(
      'Verify production SMTP and branded recovery/code delivery, then set AUTH_EMAIL_DELIVERY_VERIFIED=true. See AUTH_RUNBOOK.md.',
    )
  return errors
}
