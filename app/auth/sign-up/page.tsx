import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthEntry } from '@/components/auth/auth-entry'
import { AuthFormSkeleton } from '@/components/auth/auth-form-skeleton'
import { AuthShell } from '@/components/auth/auth-shell'
import type { AuthSearchParams } from '@/lib/auth/return-to'
export const metadata: Metadata = {
  title: 'Create account | UNLV Mountain Club',
}
export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<AuthSearchParams>
}) {
  return (
    <AuthShell
      title="Find your people."
      description="Create your free account and make yourself at home."
    >
      <Suspense fallback={<AuthFormSkeleton mode="signup" />}>
        <AuthEntry mode="signup" searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}
