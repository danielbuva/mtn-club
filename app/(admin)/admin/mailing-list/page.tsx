import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { MailingListTabs } from '@/components/admin/mailing-list-tabs'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

async function AdminMailingListPageContent() {
  await requireAdminCapability('mailing_list.read')
  const admin = createAdminClient()
  const [subscriptions, profiles] = await Promise.all([
    admin
      .from('mailing_list_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false }),
    admin.from('profiles').select('user_id, display_name'),
  ])
  if (subscriptions.error) throw subscriptions.error
  if (profiles.error) throw profiles.error

  const profileNames = Object.fromEntries(
    (profiles.data ?? []).map(profile => [
      profile.user_id,
      profile.display_name,
    ]),
  )

  return (
    <MailingListTabs
      subscriptions={subscriptions.data ?? []}
      profileNames={profileNames}
    />
  )
}

export default function AdminMailingListPage() {
  return (
    <AdminViewFrame view="mailing">
      <Suspense fallback={<AdminPanelFallback view="mailing" />}>
        <AdminMailingListPageContent />
      </Suspense>
    </AdminViewFrame>
  )
}
