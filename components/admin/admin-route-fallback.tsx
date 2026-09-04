'use client'

import { usePathname } from 'next/navigation'
import { adminViewForPath } from '@/lib/admin/views'
import { AdminPanelFallback } from './admin-panel-fallback'
import { AdminViewFrame } from './admin-view-frame'
import { AccountDetailLoading } from './loading/forms'
import { NewTripLoading } from './loading/new-trip'

export function AdminRouteFallback() {
  const pathname = usePathname()
  if (pathname === '/admin/trips/new') return <NewTripLoading />
  if (pathname.startsWith('/admin/accounts/'))
    return (
      <div aria-busy="true">
        <output className="sr-only">Loading account details…</output>
        <AccountDetailLoading />
      </div>
    )
  const view = adminViewForPath(pathname)
  return (
    <AdminViewFrame view={view}>
      <AdminPanelFallback view={view} />
    </AdminViewFrame>
  )
}
