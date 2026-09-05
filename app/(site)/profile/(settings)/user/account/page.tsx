import { Suspense } from 'react'
import { getProfileOrRedirect } from '@/app/(site)/profile/_lib/get-profile'
import { AccountSettingsFormClient } from '@/components/profile/settings/account-settings-form-client'
import { EmailVerificationPanel } from '@/components/profile/settings/email-verification-panel'
import { MobileSettingsHeader } from '@/components/profile/settings/mobile-settings-header'
import { SettingsCard } from '@/components/profile/settings/settings-card'
import { SettingsPageHeader } from '@/components/profile/settings/settings-page-header'
import { SignInMethodsPanel } from '@/components/profile/settings/sign-in-methods-panel'
import { connectedOAuthProviders } from '@/lib/auth/sign-in-methods'
import { getEmailVerificationStatus } from '@/lib/auth/verification'
import { getViewer } from '@/lib/auth/viewer'
import { createClient } from '@/lib/supabase/server'

async function AccountContent() {
  const [{ profile, userId, email }, viewer] = await Promise.all([
    getProfileOrRedirect(),
    getViewer(),
  ])
  const isAdmin = viewer.isAdmin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: ageDeclaration, error: ageError } = await supabase
    .from('account_age_declarations')
    .select('is_18_or_older, declared_at')
    .eq('user_id', userId)
    .maybeSingle()

  return (
    <>
      <SettingsCard
        title="Age declaration"
        description="Saved for trip registration; you will not be asked again."
      >
        <p className="text-sm">
          {ageError
            ? 'Unable to load your declaration. Refresh to try again.'
            : ageDeclaration
              ? `${ageDeclaration.is_18_or_older ? '18 or older' : 'Under 18'} — declared ${new Date(ageDeclaration.declared_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}.`
              : 'Not declared yet. You can declare your age when joining a trip.'}
        </p>
        {ageDeclaration && (
          <p className="mt-2 text-sm text-muted-foreground">
            Contact a club officer if this declaration needs correcting.
          </p>
        )}
      </SettingsCard>
      {user && (
        <SignInMethodsPanel
          providers={connectedOAuthProviders(user.identities)}
          email={user.email ?? null}
        />
      )}
      {user && (
        <EmailVerificationPanel
          key={user.email}
          email={email}
          status={getEmailVerificationStatus(user)}
        />
      )}
      <AccountSettingsFormClient
        initialProfile={profile}
        userId={userId}
        email={email}
        isAdmin={isAdmin}
      />
    </>
  )
}

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <MobileSettingsHeader title="Account" backHref="/profile/settings" />
      <SettingsPageHeader
        title="Account"
        description="Manage your personal details and security settings."
      />
      <Suspense
        fallback={
          <div className="space-y-6 animate-pulse" aria-busy="true">
            {[1, 2, 3, 4].map(item => (
              <div
                key={item}
                className="h-24 rounded-xl border border-border/60 bg-muted/40"
              />
            ))}
          </div>
        }
      >
        <AccountContent />
      </Suspense>
    </div>
  )
}
