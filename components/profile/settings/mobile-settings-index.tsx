'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { settingsNavSections } from '@/components/profile/settings/settings-nav-config'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'

export function MobileSettingsIndex() {
  const { confirmDiscard } = useSettingsDirty()

  return (
    <div className="space-y-6 md:hidden">
      {settingsNavSections.map((section) => (
        <div key={section.title} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {section.title}
          </p>
          <div className="rounded-xl border border-border/60 bg-card/70">
            {section.items.map((item, index) => (
              <div
                key={item.href}
                className={index === section.items.length - 1 ? '' : 'border-b border-border/50'}
              >
                <Link
                  href={item.href}
                  onClick={(event) => {
                    if (!confirmDiscard()) {
                      event.preventDefault()
                    }
                  }}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
