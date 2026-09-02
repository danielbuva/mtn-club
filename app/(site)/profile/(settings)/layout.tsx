import { SettingsShell } from '@/components/profile/settings/settings-shell'

export default function ProfileSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <SettingsShell>{children}</SettingsShell>
    </div>
  )
}
