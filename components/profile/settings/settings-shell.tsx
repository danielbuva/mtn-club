'use client'

import { SettingsNav } from '@/components/profile/settings/settings-nav'
import { SettingsDirtyProvider } from '@/components/profile/settings/settings-dirty-provider'

export function SettingsShell({ children }: { children: React.ReactNode }) {
  return (
    <SettingsDirtyProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10 lg:px-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-0 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <SettingsNav />
          </div>
        </aside>
        <div className="flex-1 space-y-6">
          {children}
        </div>
      </div>
    </SettingsDirtyProvider>
  )
}
