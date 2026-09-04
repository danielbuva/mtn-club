import { Suspense } from 'react'
import { AdminPanelFallback } from '@/components/admin/admin-panel-fallback'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { SettingsForm } from '@/components/admin/settings-form'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateAdminSettingsAction } from './actions'

async function AdminSettingsPageContent() {
  const context = await requireAdminCapability('settings.read')
  const admin = createAdminClient()
  const [term, settings] = await Promise.all([
    admin.from('club_terms').select('*').eq('is_active', true).single(),
    admin.from('club_admin_settings').select('*').eq('id', true).single(),
  ])
  if (term.error) throw term.error
  if (settings.error) throw settings.error
  const canUpdate = Boolean(context.permissions['settings.update'])

  return (
    <SettingsForm
      term={term.data}
      settings={settings.data}
      canUpdate={canUpdate}
      action={updateAdminSettingsAction}
    />
  )
}

export default function AdminSettingsPage() {
  return (
    <AdminViewFrame view="settings">
      <Suspense fallback={<AdminPanelFallback view="settings" />}>
        <AdminSettingsPageContent />
      </Suspense>
    </AdminViewFrame>
  )
}
