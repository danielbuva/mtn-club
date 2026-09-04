import { ExternalLink, Mountain } from 'lucide-react'
import { Suspense } from 'react'
import { ADMIN_NAV_ITEMS } from '@/lib/admin/constants'
import { AdminRouteFallback } from './admin-route-fallback'
import { LoadingValue } from './loading/primitives'
import { adminNavigationIcons } from './navigation-icons'

export function AdminShellFallback() {
  return (
    <div className="min-h-screen bg-[#F8F1DF] text-[#211D18] dark:bg-background dark:text-foreground">
      <aside
        aria-hidden="true"
        className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#211D18]/15 bg-[#F3E8D0] p-5 dark:border-border dark:bg-card lg:flex"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-[#211D18] text-[#FFECA2]">
            <Mountain className="size-5" />
          </span>
          <span>
            <span className="block font-brand text-lg uppercase leading-none">
              Mountain Club
            </span>
            <span className="text-xs text-[#6A5146] dark:text-muted-foreground">
              Leadership admin
            </span>
          </span>
        </div>
        <div className="mt-8 flex-1 space-y-1">
          {ADMIN_NAV_ITEMS.map(item => {
            const Icon = adminNavigationIcons[item.label]
            return (
              <div
                key={item.href}
                className="flex min-h-10 items-center gap-3 px-3 text-sm font-medium"
              >
                <Icon className="size-4" />
                {item.label}
              </div>
            )
          })}
        </div>
        <p className="flex min-h-10 items-center gap-3 px-3 text-sm font-semibold">
          <ExternalLink className="size-4" /> View public site
        </p>
        <div className="mt-4 border-t border-[#211D18]/15 pt-4 dark:border-border">
          <LoadingValue className="h-5 w-28" />
          <LoadingValue className="h-4 w-20" />
        </div>
      </aside>
      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-64">
        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
              <p className="font-brand text-xs uppercase tracking-[0.2em] text-[#6A5146] dark:text-muted-foreground">
                Leadership admin
              </p>
              <LoadingValue className="mt-2 h-12 w-56" />
            </div>
          }
        >
          <AdminRouteFallback />
        </Suspense>
      </main>
    </div>
  )
}
