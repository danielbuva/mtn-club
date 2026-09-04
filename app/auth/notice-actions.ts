'use server'
import { clearAuthFlow, readAuthFlow } from '@/lib/auth/flow-cookies'
import type { AuthNotice } from '@/lib/auth/notices'
import {
  connectedOAuthProviders,
  parseOAuthProvider,
} from '@/lib/auth/sign-in-methods'
import { createClient } from '@/lib/supabase/server'

export async function consumeAuthArrival(localNotice: AuthNotice | null) {
  const flow = await readAuthFlow('arrival')
  if (flow) await clearAuthFlow('arrival')
  if (
    !flow &&
    !['signed-in', 'created', 'password-updated'].includes(localNotice ?? '')
  )
    return null
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user || (flow && flow.userId !== user.id)) return null
  const providers = connectedOAuthProviders(user.identities)
  const provider = parseOAuthProvider(flow?.provider)
  const outcome = flow?.outcome
  return {
    notice:
      outcome === 'linked' && provider && providers.includes(provider)
        ? 'linked'
        : outcome === 'cancelled'
          ? 'cancelled'
          : outcome === 'failed'
            ? 'failed'
            : (localNotice ?? 'signed-in'),
    provider: provider && providers.includes(provider) ? provider : null,
    canAddMethod: providers.length < 2,
  }
}
