import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthFormSkeleton } from '@/components/auth/auth-form-skeleton'
import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import {
  type AuthSearchParams,
  getReturnToFromSearchParams,
  readAuthSearchParams,
} from '@/lib/auth/return-to'
export const metadata: Metadata = {
  title: 'Reset password | UNLV Mountain Club',
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const params = readAuthSearchParams(await searchParams)
  return (
    <ForgotPasswordForm returnTo={getReturnToFromSearchParams(params) ?? '/'} />
  )
}
export default function Page({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  return (
    <AuthShell
      title="Lost your password?"
      description="It happens. We’ll email you a secure link to choose a new one."
    >
      <Suspense fallback={<AuthFormSkeleton mode="recovery" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
