import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { AdminShellFallback } from '@/components/admin/admin-shell-fallback'
import { AdminViewerProvider } from '@/components/admin/admin-view-frame'
import { requireAdmin } from '@/lib/admin/auth'
import { ADMIN_NAV_ITEMS } from '@/lib/admin/constants'

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const items = ADMIN_NAV_ITEMS.filter(
    item => admin.permissions[item.capability],
  )
  const roleLabel = admin.isSuperAdmin
    ? 'Super Admin'
    : admin.roleNames.join(' · ') || 'Admin'

  return (
    <AdminViewerProvider
      viewer={{
        displayName: admin.displayName,
        permissions: admin.permissions,
        isSuperAdmin: admin.isSuperAdmin,
      }}
    >
      <AdminShell
        items={items}
        displayName={admin.displayName}
        roleLabel={roleLabel}
      >
        {children}
      </AdminShell>
    </AdminViewerProvider>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
