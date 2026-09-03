'use client'

import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Mail,
  Mountain,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AdminMobileNavigation } from '@/components/admin/admin-mobile-navigation'
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

function AdminNavigation({ items }: { items: AdminShellItem[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin navigation" className="grid gap-1">
      {items.map(item => {
        const Icon = icons[item.label as keyof typeof icons] ?? LayoutDashboard
        const active =
          item.href === '/admin'
            ? pathname === item.href
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-10 items-center gap-3 px-3 text-sm font-medium outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring',
              active && 'bg-[#E9DDC3] text-[#211D18]',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminShell({
  children,
  items,
  displayName,
  roleLabel,
}: {
  children: ReactNode
  items: AdminShellItem[]
  displayName: string
  roleLabel: string
}) {
  return (
    <div className="min-h-screen bg-[#F8F1DF] text-[#211D18] dark:bg-background dark:text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[#211D18]/15 bg-[#F3E8D0] p-5 dark:border-border dark:bg-card lg:flex lg:flex-col">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-[#211D18] text-[#FFECA2]">
            <Mountain className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-brand text-lg uppercase leading-none">
              Mountain Club
            </span>
            <span className="text-xs text-[#6A5146] dark:text-muted-foreground">
              Leadership admin
            </span>
          </span>
        </Link>
        <div className="mt-8 flex-1">
          <AdminNavigation items={items} />
        </div>
        <Link
          href="/"
          className="flex min-h-10 items-center gap-3 px-3 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          View public site
        </Link>
        <div className="mt-4 border-t border-[#211D18]/15 pt-4 dark:border-border">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-[#6A5146] dark:text-muted-foreground">
            {roleLabel}
          </p>
        </div>
      </aside>

      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-64">{children}</main>
      <AdminMobileNavigation items={items} />
    </div>
  )
}
