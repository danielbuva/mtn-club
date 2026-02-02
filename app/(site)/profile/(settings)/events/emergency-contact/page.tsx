import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { EmergencyContactFormClient } from '@/components/profile/settings/emergency-contact-form-client'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'

export default async function EmergencyContactPage() {
  const { profile, userId } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader
        title="Emergency contact"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Emergency contact"
        description="Let us know who to contact in case of emergency."
      />
      <EmergencyContactFormClient initialProfile={profile} userId={userId} />
    </div>
  )
}
