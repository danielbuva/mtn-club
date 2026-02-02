'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { settingsNavSections } from '@/components/profile/settings/settings-nav-config'
import { cn } from '@/lib/utils'

type SettingsNavProps = {
  onNavigate?: () => void
}

export function SettingsNav({ onNavigate }: SettingsNavProps) {
  const pathname = usePathname()
  const { confirmDiscard } = useSettingsDirty()

  return (
    <nav className="space-y-6 text-sm">
      {settingsNavSections.map(section => (
        <div key={section.title} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={event => {
                    if (!confirmDiscard()) {
                      event.preventDefault()
                      return
                    }
                    onNavigate?.()
                  }}
                  className={cn(
                    'flex w-full items-center rounded-md px-3 py-2 transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
