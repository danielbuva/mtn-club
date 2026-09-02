'use client'

import { Menu, Mountain } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId } from 'react'
import { usePublicNavigationState } from '@/components/navigation/public-navigation-state'
import { ThemeCycleButton } from '@/components/navigation/theme-cycle-button'
import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'
import { cn } from '@/lib/utils'

const items = [
  { href: '/', label: 'Home' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/join', label: 'Join' },
] as const

const linkClass =
  'flex min-h-10 items-center rounded-full px-2 text-xs font-semibold outline-none transition hover:bg-[#E9DDC3] focus-visible:ring-2 focus-visible:ring-[#211D18]'

const desktopLinkClass =
  'flex h-16 items-center border-b-2 border-transparent px-4 text-sm font-semibold outline-none transition hover:border-foreground/30 hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

export function PublicThumbNavigation() {
  const { animationsReady, open, toggle } = usePublicNavigationState()
  const pathname = usePathname()
  const navigationId = useId()

  return (
    <>
      <header className="sticky top-0 z-40 hidden h-16 border-b border-border bg-background/95 text-foreground backdrop-blur-md md:block">
        <div className="relative mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link
            href="/"
            className="flex h-16 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <Mountain className="size-5" aria-hidden="true" />
            <span className="font-brand text-lg uppercase tracking-wide">
              UNLV Mountain Club
            </span>
          </Link>

          <nav
            aria-label="Site navigation"
            className="absolute left-1/2 flex h-16 -translate-x-1/2 items-center"
          >
            {items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className={cn(
                  desktopLinkClass,
                  pathname === item.href &&
                    'border-foreground bg-secondary text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeCycleButton className="rounded-none bg-transparent hover:bg-secondary" />
        </div>
      </header>

      <div className="md:hidden">
        <ThumbNavigationBar
          ariaLabel="Site navigation"
          tone="paper"
          placement="right"
          className={cn(
            'gap-0 overflow-hidden',
            animationsReady &&
              'transition-[gap] duration-300 ease-out motion-reduce:transition-none',
            open && 'gap-1',
          )}
          showTheme={false}
        >
          <div
            id={`${navigationId}-links`}
            aria-hidden={!open}
            className={cn(
              'h-11 min-w-0 max-w-0 overflow-hidden opacity-0',
              animationsReady &&
                'transition-[max-width,opacity] duration-300 ease-out motion-reduce:transition-none',
              open && 'max-w-80 opacity-100',
            )}
          >
            <div className="flex h-11 w-max items-center gap-1">
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  tabIndex={open ? undefined : -1}
                  className={cn(
                    linkClass,
                    pathname === item.href && 'bg-[#E9DDC3] text-[#211D18]',
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <ThemeCycleButton tabIndex={open ? undefined : -1} />
            </div>
          </div>

          <button
            type="button"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls={`${navigationId}-links`}
            onClick={toggle}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#211D18] text-[#FFECA2] outline-none transition hover:bg-[#352E27] focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </ThumbNavigationBar>
      </div>
    </>
  )
}
