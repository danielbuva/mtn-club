import { Suspense } from 'react'
import {
  GuardianProfile,
  GuardianProfileSkeleton,
} from '@/components/guardian/guardian-profile'
import { Notice } from '@/components/guardian/ui'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { getMyGuardianStatus } from '@/lib/guardian/server'

async function GuardianStatusSection() {
  const status = await getMyGuardianStatus()
  if (!status)
    return (
      <Notice tone="error">
        Guardian details didn’t load. Refresh the page, or contact the club if
        it keeps happening.
      </Notice>
    )
  return <GuardianProfile status={status} />
}

export default function GuardianPermissionPage() {
  return (
    <div data-trip-surface className="space-y-6">
      <MobileSettingsHeader
        title="Guardian permission"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Guardian permission"
        description="For members under 18: who signs for you, and what’s covered."
      />
      <Suspense fallback={<GuardianProfileSkeleton />}>
        <GuardianStatusSection />
      </Suspense>
    </div>
  )
}
