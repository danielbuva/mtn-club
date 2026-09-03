import { Download } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { MailingListTabs } from '@/components/admin/mailing-list-tabs'
import { Button } from '@/components/ui/button'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminMailingListPage() {
  const context = await requireAdminCapability('mailing_list.read')
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
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <AdminPageHeader
        title="Mailing list"
        description="Consent-backed subscriber records. Campaign sending is intentionally outside part one."
        actions={
          context.permissions['mailing_list.export'] ? (
            <Button asChild>
              <a href="/admin/mailing-list/export">
                <Download className="size-4" /> Export opted-in CSV
              </a>
            </Button>
          ) : null
        }
      />

      <MailingListTabs
        subscriptions={subscriptions.data ?? []}
        profileNames={profileNames}
      />
    </div>
  )
}
