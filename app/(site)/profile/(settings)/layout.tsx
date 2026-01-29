import { SettingsShell } from '@/components/profile/settings/settings-shell'

export default function ProfileSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pt-16">
      <SettingsShell>{children}</SettingsShell>
    </div>
  )
}
