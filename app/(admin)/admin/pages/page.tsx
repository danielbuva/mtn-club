import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { PagesDirectory } from '@/components/admin/pages/pages-directory'
import { getPagesDirectoryData } from '@/lib/admin/pages'

async function AdminPagesContent() {
  return <PagesDirectory data={await getPagesDirectoryData()} />
}

export default function AdminPagesPage() {
  return (
    <AdminViewFrame view="pages">
      <Suspense fallback={<AdminPanelFallback view="pages" />}>
        <AdminPagesContent />
      </Suspense>
    </AdminViewFrame>
  )
}
