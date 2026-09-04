import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthFormSkeleton } from '@/components/auth/auth-form-skeleton'
import { AuthShell } from '@/components/auth/auth-shell'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'
import { Button } from '@/components/ui/button'
import { passwordResetUser } from '@/lib/auth/recovery-session'
import {
  type AuthSearchParams,
  authHref,
  getReturnToFromSearchParams,
  readAuthSearchParams,
} from '@/lib/auth/return-to'
import { createClient } from '@/lib/supabase/server'
export const metadata: Metadata = {
  title: 'Choose a new password | UNLV Mountain Club',
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const params = readAuthSearchParams(await searchParams)
  const returnTo = getReturnToFromSearchParams(params) ?? '/'
  const code = params.get('code')
  if (code)
    redirect(
      `/auth/callback?${new URLSearchParams({ code, flow: 'recovery', returnTo })}`,
    )
  const supabase = await createClient()
  const user = await passwordResetUser(supabase)
  if (!user)
    return (
      <div className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Open a fresh password-reset link from your email to continue. Your
          previous link may have expired.
        </p>
        <Button asChild className="min-h-12 w-full">
          <Link href={authHref('/auth/forgot-password', returnTo)}>
            Request a new reset link
          </Link>
        </Button>
      </div>
    )
  return <UpdatePasswordForm returnTo={returnTo} email={user.email ?? null} />
}
export default function Page({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  return (
    <AuthShell
      title="A fresh start."
      description="Choose a unique password for your Mountain Club account."
    >
      <Suspense fallback={<AuthFormSkeleton mode="password" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
