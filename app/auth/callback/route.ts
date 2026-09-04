import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { setAuthFlow } from '@/lib/auth/flow-cookies'
import { completeIdentityLink } from '@/lib/auth/link-callback'
import { maybeHydrateProfileFromOAuth } from '@/lib/auth/oauth-profile'
import { grantPasswordReset } from '@/lib/auth/recovery-session'
import { authHref, getReturnToFromSearchParams } from '@/lib/auth/return-to'
import { parseOAuthProvider } from '@/lib/auth/sign-in-methods'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const returnTo = getReturnToFromSearchParams(params) ?? '/'
  const flow = params.get('flow')
  const code = params.get('code')
  const provider = parseOAuthProvider(params.get('provider'))
  const cancelled = params.get('error') === 'access_denied'
  let failed = !code || params.has('error')

  if (flow === 'link') {
    let outcome = 'expired'
    try {
      outcome = await completeIdentityLink(params)
    } catch {
      /* Offer a safe retry. */
    }
    if (outcome === 'expired')
      redirect(
        '/auth/error?reason=link-expired&returnTo=%2Fprofile%2Fuser%2Faccount',
      )
    redirect('/profile/user/account#sign-in-methods')
  }

  if (code && !failed) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      failed = Boolean(error)
      if (!error && flow === 'recovery')
        failed = !(await grantPasswordReset(supabase))
      if (!error && data.user && flow !== 'recovery')
        await setAuthFlow('arrival', {
          userId: data.user.id,
          provider,
          outcome: 'signed-in',
        })
    } catch {
      failed = true
    }
  }

  if (failed) {
    const errorParams = new URLSearchParams({
      returnTo,
      reason: cancelled ? 'cancelled' : 'invalid-link',
    })
    if (flow === 'recovery') errorParams.set('flow', 'recovery')
    redirect(`/auth/error?${errorParams}`)
  }
  if (flow === 'recovery') redirect(authHref('/auth/update-password', returnTo))
  await maybeHydrateProfileFromOAuth()
  redirect(returnTo)
}
