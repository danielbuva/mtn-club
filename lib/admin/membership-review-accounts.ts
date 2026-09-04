import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

// Auth accounts exist before a profile or membership application is completed.
export async function listMembershipReviewAccounts() {
  const admin = createAdminClient()
  const accounts: { id: string; email?: string; created_at: string }[] = []
  const perPage = 1000
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    accounts.push(
      ...data.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      })),
    )
    if (data.users.length < perPage) return accounts
  }
}
