'use client'

import { ChevronLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useSettingsDirty } from '@/components/profile/settings/settings-dirty-provider'
import { Button } from '@/components/ui/button'

type MobileSettingsHeaderProps = {
  title: string
  backHref: string
}

export function MobileSettingsHeader({
  title,
  backHref,
}: MobileSettingsHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { confirmDiscard } = useSettingsDirty()

  const handleBack = () => {
    if (!confirmDiscard()) return
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    if (referrer) {
      try {
        const url = new URL(referrer)
        if (
          url.origin === window.location.origin &&
          url.pathname.startsWith('/profile')
        ) {
          router.back()
          return
        }
      } catch {
        // fall through to push
      }
    }
    if (pathname !== backHref) {
      router.push(backHref)
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleBack}
          >
            <ChevronLeft className="h-4 w-4" />
            Settings
          </Button>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
      </div>
      <div className="h-[3.75rem] md:hidden" aria-hidden="true" />
    </>
  )
}
