import type { ReactNode } from 'react'
import { ThemeCycleButton } from '@/components/navigation/theme-cycle-button'
import { cn } from '@/lib/utils'

export const thumbMenuButtonClass =
  'flex size-11 shrink-0 items-center justify-center rounded-none bg-[#211D18] text-[#FFECA2] outline-none transition hover:bg-[#352E27] focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]'

export function ThumbNavigationBar({
  children,
  className,
  containerClassName,
  ariaLabel = 'Page actions',
  tone = 'app',
  placement = 'center',
  showTheme = false,
}: {
  children: ReactNode
  className?: string
  containerClassName?: string
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
        containerClassName,
      )}
    >
      <nav
        data-thumb-navigation
        aria-label={ariaLabel}
        className={cn(
          'pointer-events-auto flex min-h-12 items-center gap-1 rounded-full border p-1.5 backdrop-blur-md',
          tone === 'paper'
            ? 'border-[color:color-mix(in_srgb,var(--editorial-ink)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--editorial-page)_92%,transparent)] text-[color:var(--editorial-ink)]'
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
