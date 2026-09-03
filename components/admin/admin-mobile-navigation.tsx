'use client'

import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Mail,
  Menu,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { ThemeCycleButton } from '@/components/navigation/theme-cycle-button'
import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'
import { cn } from '@/lib/utils'

type AdminShellItem = { href: string; label: string }

const icons = {
  Overview: LayoutDashboard,
  Trips: CalendarDays,
  Membership: ShieldCheck,
  Accounts: Users,
  Analytics: BarChart3,
  'Mailing List': Mail,
  Gallery: GalleryHorizontalEnd,
  'Leadership & Access': UserRoundCog,
  Settings,
} as const

const shortLabels = {
  Overview: 'Overview',
  Trips: 'Trips',
  Membership: 'Members',
  Accounts: 'Accounts',
  Analytics: 'Analytics',
  'Mailing List': 'Mailing',
  Gallery: 'Gallery',
  'Leadership & Access': 'Access',
  Settings: 'Settings',
} as const

export function AdminMobileNavigation({ items }: { items: AdminShellItem[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const navigationId = useId()
  const links = [
    ...items.map(item => ({ ...item, external: false })),
    { href: '/', label: 'Public site', external: true },
  ]

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 z-30 bg-transparent lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <ThumbNavigationBar
        ariaLabel="Admin navigation"
        tone="paper"
        placement="right"
        showTheme={false}
        containerClassName="pb-[max(1.75rem,env(safe-area-inset-bottom))]"
        className="relative gap-0 overflow-visible rounded-none lg:hidden"
      >
        <div
          id={navigationId}
          className={cn(
            'grid origin-bottom-right gap-2 transition-[grid-template-columns] duration-200 motion-reduce:transition-none',
            open ? 'grid-cols-3' : 'grid-cols-1',
          )}
        >
          {open
            ? links.map(item => {
                const Icon = item.external
                  ? ExternalLink
                  : (icons[item.label as keyof typeof icons] ?? LayoutDashboard)
                const active =
                  !item.external &&
                  (item.href === '/admin'
                    ? pathname === item.href
                    : pathname.startsWith(item.href))
                const label = item.external
                  ? 'Site'
                  : shortLabels[item.label as keyof typeof shortLabels]

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex size-13 flex-col items-center justify-center gap-1 border border-[color:color-mix(in_srgb,var(--editorial-ink)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--editorial-page)_94%,transparent)] text-[9px] font-semibold leading-none text-[color:var(--editorial-ink)] shadow-sm outline-none transition-[background-color,box-shadow] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[color:var(--editorial-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--editorial-page)]',
                      active &&
                        'bg-[color:var(--editorial-ink)] text-[color:var(--editorial-page)]',
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                )
              })
            : null}

          {open ? (
            <ThemeCycleButton
              shape="square"
              showLabel
              className="size-13 border border-[color:color-mix(in_srgb,var(--editorial-ink)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--editorial-page)_94%,transparent)] text-[color:var(--editorial-ink)] shadow-sm hover:bg-[color:color-mix(in_srgb,var(--editorial-ink)_8%,var(--editorial-page))] hover:shadow-md"
            />
          ) : null}

          <button
            type="button"
            aria-label={
              open ? 'Close admin navigation' : 'Open admin navigation'
            }
            aria-expanded={open}
            aria-controls={navigationId}
            onClick={() => setOpen(current => !current)}
            className={cn(
              'relative flex size-13 shrink-0 items-center justify-center bg-[#211D18] text-[#FFECA2] outline-none transition hover:bg-[#352E27] focus-visible:ring-2 focus-visible:ring-[#211D18] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F1DF]',
              open && 'col-start-3',
            )}
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </ThumbNavigationBar>
    </>
  )
}
