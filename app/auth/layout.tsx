import { Suspense } from 'react'
import {
  AuthCloseButton,
  AuthCloseFallback,
} from '@/components/auth/auth-close-button'
import { AuthReturnTo } from '@/components/auth/auth-return-to'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh">
      <Suspense fallback={null}>
        <AuthReturnTo />
      </Suspense>
      <Suspense fallback={<AuthCloseFallback />}>
        <AuthCloseButton />
      </Suspense>
      {children}
    </div>
  )
}
