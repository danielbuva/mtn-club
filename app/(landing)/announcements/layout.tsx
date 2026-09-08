import type { ReactNode } from 'react'
import { PublicThumbNavigation } from '@/components/navigation/public-thumb-navigation'
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background px-6 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] text-foreground sm:px-12 sm:pt-12 md:pb-12">
      <PublicThumbNavigation mobileOnly />
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  )
}
