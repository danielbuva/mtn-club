'use client'

import { useAdminViewer } from '../admin-view-frame'
import { SettingsForm } from '../settings-form'

export function SettingsLoading() {
  const viewer = useAdminViewer()
  return (
    <SettingsForm
      loading
      canUpdate={!viewer || Boolean(viewer.permissions['settings.update'])}
    />
  )
}
