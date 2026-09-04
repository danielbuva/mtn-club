'use client'

import { CalendarPlus, Download, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { createContext, type ReactNode, Suspense, useContext } from 'react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AdminContext } from '@/lib/admin/auth'
import { ADMIN_VIEWS, type AdminView } from '@/lib/admin/views'
import { cn } from '@/lib/utils'
import { TripFilterToolbar } from './trip-filter-toolbar'
import { TripFilters } from './trips-filters'

type Viewer = Pick<AdminContext, 'displayName' | 'permissions' | 'isSuperAdmin'>
const AdminViewerContext = createContext<Viewer | null>(null)

export function AdminViewerProvider({
  viewer,
  children,
}: {
  viewer: Viewer
  children: ReactNode
}) {
  return <AdminViewerContext value={viewer}>{children}</AdminViewerContext>
}

export function useAdminViewer() {
  return useContext(AdminViewerContext)
}

export function AdminViewFrame({
  view,
  children,
}: {
  view: AdminView
  children: ReactNode
}) {
  const viewer = useAdminViewer()
  const metadata = ADMIN_VIEWS[view]
  const title =
    view === 'overview' && viewer
      ? `Welcome back, ${viewer.displayName.split(' ')[0]}`
      : metadata.title
  let actions: ReactNode = null
  if (
    (view === 'overview' || view === 'trips') &&
    viewer?.permissions['trips.create']
  ) {
    actions = (
      <Button
        asChild
        className="bg-[#211D18] text-[#FFECA2] hover:bg-[#352E27]"
      >
        <Link href="/admin/trips/new">
          {view === 'trips' ? <CalendarPlus className="size-4" /> : null}Create
          trip
        </Link>
      </Button>
    )
  } else if (view === 'mailing' && viewer?.permissions['mailing_list.export']) {
    actions = (
      <Button asChild>
        <a href="/admin/mailing-list/export">
          <Download className="size-4" />
          Export opted-in CSV
        </a>
      </Button>
    )
  } else if (view === 'leadership' && viewer?.isSuperAdmin) {
    actions = (
      <Badge>
        <ShieldCheck className="size-3" />
        Super Admin controls enabled
      </Badge>
    )
  }
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 py-8 sm:px-8 lg:py-10',
        view === 'settings' ? 'max-w-5xl' : 'max-w-7xl',
      )}
    >
      <AdminPageHeader
        title={title}
        description={metadata.description}
        actions={actions}
      />
      {view === 'trips' ? (
        <Suspense fallback={<TripFilters disabled />}>
          <TripFilterToolbar />
        </Suspense>
      ) : null}
      {children}
    </div>
  )
}
