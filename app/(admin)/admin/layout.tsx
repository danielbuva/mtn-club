import { Suspense } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/admin/auth'
import { ADMIN_NAV_ITEMS } from '@/lib/admin/constants'
import AdminLoading from './loading'

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  const items = ADMIN_NAV_ITEMS.filter(
    item => admin.permissions[item.capability],
  )
  const roleLabel = admin.isSuperAdmin
    ? 'Super Admin'
    : admin.roleNames.join(' · ') || 'Admin'

  return (
    <AdminShell
      items={items}
      displayName={admin.displayName}
      roleLabel={roleLabel}
    >
      {children}
    </AdminShell>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  )
}
