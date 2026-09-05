import { Suspense } from 'react'
import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { PrivacySettingsFormClient } from '@/components/profile/settings/privacy-settings-form-client'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { emailPreferencesSchema } from '@/lib/profile/email-preferences'
import { createClient } from '@/lib/supabase/server'

async function PrivacyContent() {
  const [{ profile }, db] = await Promise.all([
    getProfileOrRedirect(),
    createClient(),
  ])
  const { data, error } = await db.rpc('get_my_email_preferences')
  if (error)
    return (
      <p role="alert">
        Email preferences could not be loaded. Refresh before changing your
        choices.
      </p>
    )
  return (
    <PrivacySettingsFormClient
      initialProfile={profile}
      initialEmail={emailPreferencesSchema.parse(data)}
    />
  )
}
function PrivacySkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading privacy settings">
      {[
        { title: 'Data & privacy', rows: 3 },
        { title: 'Email preferences', rows: 7 },
        { title: 'Community sharing', rows: 4 },
      ].map(card => (
        <SettingsCard title={card.title} key={card.title}>
          <div className="space-y-4">
            {Array.from({ length: card.rows }, (_, index) => (
              <div
                className="flex h-12 items-center justify-between gap-4"
                key={`${card.title}-${index}`}
              >
                <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-6 w-10 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </SettingsCard>
      ))}
    </section>
  )
}
export default function PrivacySettingsPage() {
  return (
    <div className="space-y-6">
      <MobileSettingsHeader
        title="Data & Privacy"
        backHref="/profile/settings"
      />
      <SettingsPageHeader
        title="Data & Privacy"
        description="Choose what you share and which emails you receive."
      />
      <Suspense fallback={<PrivacySkeleton />}>
        <PrivacyContent />
      </Suspense>
    </div>
  )
}
