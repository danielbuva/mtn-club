import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthMessageSkeleton } from '@/components/auth/auth-message-skeleton'
import { AuthShell } from '@/components/auth/auth-shell'
import { ConfirmationForm } from '@/components/auth/confirmation-form'
import { parseEmailOtpType } from '@/lib/auth/confirmation'
import {
  type AuthSearchParams,
  authHref,
  getReturnToFromSearchParams,
  readAuthSearchParams,
} from '@/lib/auth/return-to'
export const metadata: Metadata = {
  title: 'Confirm your request | UNLV Mountain Club',
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const params = readAuthSearchParams(await searchParams)
  const type = parseEmailOtpType(params.get('type'))
  const tokenHash = params.get('token_hash')
  const returnTo = getReturnToFromSearchParams(params) ?? '/'
  const code = params.get('code')
  if (code)
    redirect(
      `/auth/callback?${new URLSearchParams({ code, flow: params.get('flow') === 'recovery' ? 'recovery' : 'email', returnTo })}`,
    )
  return tokenHash && type ? (
    <ConfirmationForm tokenHash={tokenHash} type={type} returnTo={returnTo} />
  ) : (
    <div className="space-y-5">
      <p>This link is incomplete. Request a new email to continue.</p>
      <Link
        className="inline-flex min-h-12 items-center underline"
        href={authHref('/auth/forgot-password', returnTo)}
      >
        Request a password-reset link
      </Link>
    </div>
  )
}
export default function Page({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  return (
    <AuthShell
      title="One more step."
      description="Let’s make sure this request came from you."
    >
      <Suspense fallback={<AuthMessageSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
