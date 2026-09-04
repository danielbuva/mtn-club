import 'server-only'
import {
  clearAuthFlow,
  readAuthFlow,
  setAuthFlow,
} from '@/lib/auth/flow-cookies'
import { maybeHydrateProfileFromOAuth } from '@/lib/auth/oauth-profile'
import {
  isExpectedLinkedAccount,
  parseOAuthProvider,
} from '@/lib/auth/sign-in-methods'
import { createClient } from '@/lib/supabase/server'

export async function completeIdentityLink(params: URLSearchParams) {
  const flow = await readAuthFlow('link')
  await clearAuthFlow('link')
  const provider = parseOAuthProvider(flow?.provider)
  if (
    !provider ||
    typeof flow?.userId !== 'string' ||
    params.get('provider') !== provider
  )
    return 'expired'
  const supabase = await createClient()
  const { data: before, error: sessionError } = await supabase.auth.getUser()
  if (sessionError || before.user?.id !== flow.userId) return 'expired'
  let outcome = 'failed'
  const code = params.get('code')
  if (params.get('error') === 'access_denied') outcome = 'cancelled'
  else if (code && !params.has('error')) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (
      !error &&
      isExpectedLinkedAccount({ userId: flow.userId, provider }, data.user)
    ) {
      outcome = 'linked'
      await maybeHydrateProfileFromOAuth()
    } else if (!error && data.user?.id !== flow.userId) {
      // Never leave the browser in another person's account if the provider
      // returns an unexpected user. No account data is merged here.
      await supabase.auth.signOut({ scope: 'local' })
      return 'expired'
    }
  }
  await setAuthFlow('arrival', { userId: flow.userId, provider, outcome })
  return outcome
}
