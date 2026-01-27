import { AuthCloseButton, AuthCloseFallback } from '@/components/auth/auth-close-button'
import { AuthReturnTo } from '@/components/auth/auth-return-to'
import { Suspense } from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
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
