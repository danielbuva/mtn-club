import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { NotificationsSettingsFormClient } from '@/components/profile/settings/notifications-settings-form-client'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { createClient } from '@/lib/supabase/server'

export default async function NotificationsSettingsPage() {
  const { profile, userId, email } = await getProfileOrRedirect()
  const supabase = await createClient()
  const { data: mailingList } = await supabase
    .from('mailing_list_subscriptions')
    .select('subscribed')
    .eq('user_id', userId)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader
        title="Notifications"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Notifications"
        description="Choose how the club should contact you."
      />
      <NotificationsSettingsFormClient
        initialProfile={profile}
        userId={userId}
        email={email}
        initialMailingListSubscribed={mailingList?.subscribed ?? false}
      />
    </div>
  )
}
