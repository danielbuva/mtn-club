import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { AuthMessageSkeleton } from '@/components/auth/auth-message-skeleton'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import {
  type AuthSearchParams,
  authHref,
  getReturnToFromSearchParams,
  readAuthSearchParams,
} from '@/lib/auth/return-to'
export const metadata: Metadata = {
  title: 'Authentication help | UNLV Mountain Club',
}
async function Content({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  const params = readAuthSearchParams(await searchParams)
  const returnTo = getReturnToFromSearchParams(params) ?? '/'
  const recovery = params.get('flow') === 'recovery'
  const cancelled = params.get('reason') === 'cancelled'
  const linkExpired = params.get('reason') === 'link-expired'
  return (
    <div className="space-y-5">
      <p className="text-base leading-7 text-muted-foreground">
        {linkExpired
          ? 'This connection request expired or belongs to a different session. Return to Account settings and start a new connection. No accounts were merged.'
          : cancelled
            ? 'Sign-in was cancelled. You can try again or choose another sign-in method.'
            : recovery
              ? 'Your reset link may have expired or already been used. Request a new one to continue.'
              : 'We couldn’t complete sign-in. Try again, choose another method, or contact the club if this keeps happening.'}
      </p>
      <Button asChild className="min-h-12 w-full">
        <Link
          href={
            linkExpired
              ? '/profile/user/account#sign-in-methods'
              : authHref(
                  recovery ? '/auth/forgot-password' : '/auth/login',
                  returnTo,
                )
          }
        >
          {linkExpired
            ? 'Review sign-in methods'
            : recovery
              ? 'Request a new reset link'
              : 'Back to sign in'}
        </Link>
      </Button>
      <Link
        href={returnTo}
        className="inline-flex min-h-12 items-center text-sm underline underline-offset-4"
      >
        Return to the site
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
      title="Let’s try again."
      description="No worries—we’ll help you get back on track."
    >
      <Suspense fallback={<AuthMessageSkeleton lines={3} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
