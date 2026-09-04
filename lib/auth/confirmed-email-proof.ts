import 'server-only'
import { saveEmailProof } from '@/lib/auth/verify-email-proof'
import { createAdminClient } from '@/lib/supabase/admin'

export async function recordConfirmedEmail(user: {
  id: string
  email?: string
}) {
  try {
    const admin = createAdminClient()
    return await saveEmailProof(user, {
      currentAccount: async id => {
        const { data, error } = await admin.auth.admin.getUserById(id)
        return error ? null : data.user
      },
      saveMetadata: async (id, app_metadata) => {
        const { error } = await admin.auth.admin.updateUserById(id, {
          app_metadata,
        })
        return !error
      },
    })
  } catch {
    // An informational proof-storage failure must not strand a person whose
    // one-time link was already consumed. Settings still offer code verification.
    return { error: 'Mailbox verification status could not be saved.' }
  }
}
