import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { SkillsPreferencesFormClient } from '@/components/profile/settings/skills-preferences-form-client'
import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'

export default async function SkillsPreferencesPage() {
  const { profile, userId } = await getProfileOrRedirect()

  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Skills" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Skills"
        description="Highlight certifications and skills you want to share."
      />
      <SkillsPreferencesFormClient initialProfile={profile} userId={userId} />
    </div>
  )
}
