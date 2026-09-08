import { Menu } from 'lucide-react'
import { type ReactNode, Suspense } from 'react'
import { PublicThumbNavigation } from '@/components/navigation/public-thumb-navigation'
import {
  ThumbNavigationBar,
  thumbMenuButtonClass,
} from '@/components/navigation/thumb-navigation'

function NavigationFallback() {
  return (
    <div className="md:hidden" aria-busy="true">
      <ThumbNavigationBar
        ariaLabel="Loading site navigation"
        tone="paper"
        placement="right"
        containerClassName="z-[45]"
        className="gap-0 overflow-hidden rounded-none"
      >
        <button
          type="button"
          disabled
          aria-label="Loading navigation"
          className={thumbMenuButtonClass}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </ThumbNavigationBar>
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background px-6 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] text-foreground sm:px-12 sm:pt-12 md:pb-12">
      <Suspense fallback={<NavigationFallback />}>
        <PublicThumbNavigation mobileOnly />
      </Suspense>
      <div className="mx-auto max-w-5xl">{children}</div>
    </main>
  )
}
