import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { ProfileNameForm } from '@/components/auth/profile-name-form'
import { needsProfileName } from '@/lib/auth/profile-name'
import {
  type AuthSearchParams,
  getReturnToFromSearchParams,
  readAuthSearchParams,
} from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Add your name | UNLV Mountain Club',
}

async function ProfileNameEntry({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const [params, db] = await Promise.all([searchParams, createClient()])
  const returnTo =
    getReturnToFromSearchParams(readAuthSearchParams(params)) ?? '/'
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
  if (!(await needsProfileName(db, user))) redirect(returnTo)
  const { data: profile } = await db
    .from('profiles')
    .select('first_name,last_name')
    .eq('user_id', user.id)
    .maybeSingle()
  return (
    <ProfileNameForm
      returnTo={returnTo}
      initialFirstName={profile?.first_name ?? ''}
      initialLastName={profile?.last_name ?? ''}
    />
  )
}

function ProfileNameSkeleton() {
  return (
    <output aria-label="Loading" className="block space-y-5">
      <span className="grid gap-5 sm:grid-cols-2">
        {['first', 'last'].map(key => (
          <span key={key} className="grid gap-2">
            <span className="h-4 w-20 animate-pulse bg-muted" />
            <span className="h-12 animate-pulse border border-foreground/25" />
          </span>
        ))}
      </span>
      <span className="block h-12 w-full animate-pulse bg-muted" />
    </output>
  )
}

export default function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  return (
    <AuthShell
      title="Add your name."
      description="Trip leaders and club officers see your first and last name on trip rosters, so they know who’s coming. Use the name you go by."
      showClose={false}
    >
      <Suspense fallback={<ProfileNameSkeleton />}>
        <ProfileNameEntry searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
