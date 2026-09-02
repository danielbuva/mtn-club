import type { ReactNode } from 'react'
import { ThemeCycleButton } from '@/components/navigation/theme-cycle-button'
import { cn } from '@/lib/utils'

export function ThumbNavigationBar({
  children,
  className,
  ariaLabel = 'Page actions',
  tone = 'app',
  placement = 'center',
  showTheme = false,
}: {
  children: ReactNode
  className?: string
  ariaLabel?: string
  tone?: 'app' | 'paper'
  placement?: 'center' | 'right'
  showTheme?: boolean
}) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex pb-[max(1rem,env(safe-area-inset-bottom))]',
        placement === 'right'
          ? 'justify-end px-[max(1.25rem,env(safe-area-inset-right))]'
          : 'justify-center px-4',
      )}
    >
      <nav
        data-thumb-navigation
        aria-label={ariaLabel}
        className={cn(
          'pointer-events-auto flex min-h-12 items-center gap-1 rounded-full border p-1.5 backdrop-blur-md',
          tone === 'paper'
            ? 'border-[#211D18]/20 bg-[#F8F1DF]/92 text-[#211D18]'
            : 'border-border/60 bg-background/90 text-foreground',
          className,
        )}
      >
        {children}
        {showTheme ? <ThemeCycleButton /> : null}
      </nav>
    </div>
  )
}
