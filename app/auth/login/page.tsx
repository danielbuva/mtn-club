import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthEntry } from '@/components/auth/auth-entry'
import { AuthFormSkeleton } from '@/components/auth/auth-form-skeleton'
import { AuthShell } from '@/components/auth/auth-shell'
import type { AuthSearchParams } from '@/lib/auth/return-to'
export const metadata: Metadata = { title: 'Sign in | UNLV Mountain Club' }
export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  return (
    <AuthShell
      title="Welcome back."
      description="Sign in to your Mountain Club account. Your next adventure is waiting."
    >
      <Suspense fallback={<AuthFormSkeleton />}>
        <AuthEntry mode="login" searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
