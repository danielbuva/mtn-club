'use server'
import { headers } from 'next/headers'
import { clearAuthFlow, setAuthFlow } from '@/lib/auth/flow-cookies'
import { getOAuthLinkErrorMessage } from '@/lib/auth/oauth-link'
import {
  connectedOAuthProviders,
  parseOAuthProvider,
} from '@/lib/auth/sign-in-methods'
import { createClient } from '@/lib/supabase/server'

export async function connectSignInMethod(
  input: unknown,
): Promise<{ url: string; error?: never } | { error: string; url?: never }> {
  const provider = parseOAuthProvider(input)
  if (!provider) return { error: 'Choose Google or Discord to continue.' }
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user)
      return {
        error:
          'Your session expired. Sign in again before connecting an account.',
      }
    if (connectedOAuthProviders(user.identities).includes(provider))
      return {
        error:
          'That sign-in method is already connected. Refresh to see your current methods.',
      }
    // Next Server Actions enforce same-origin submissions. Never accept a
    // caller-supplied destination or account ID for identity linking.
    const origin = (await headers()).get('origin')
    if (!origin) return { error: 'Refresh Account settings and try again.' }
    const callback = new URL('/auth/callback', origin)
    callback.searchParams.set('flow', 'link')
    callback.searchParams.set('provider', provider)
    const result = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
    })
    if (result.error) return { error: getOAuthLinkErrorMessage(result.error) }
    if (!result.data.url)
      return { error: 'The provider did not open. Please try again.' }
    await setAuthFlow('link', { userId: user.id, provider })
    return { url: result.data.url }
  } catch {
    await clearAuthFlow('link')
    return {
      error:
        'We could not open the provider. Check your connection and try again.',
    }
  }
}
