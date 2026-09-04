'use client'

import { useAdminMobileMenuOpen } from '@/components/admin/mobile-menu-context'
import { BackButton } from '@/components/back-button'
import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EventFloatingActions({
  admin,
  isSubmitting,
  isSavingDraft,
  onSaveDraft,
}: {
  admin: boolean
  isSubmitting: boolean
  isSavingDraft: boolean
  onSaveDraft: () => Promise<void>
}) {
  const menuOpen = useAdminMobileMenuOpen()
  const hidden = admin && menuOpen
  const busy = isSubmitting || isSavingDraft

  return (
    <div inert={hidden} aria-hidden={hidden}>
      <ThumbNavigationBar
        ariaLabel="Trip actions"
        containerClassName={cn(
          'transition-[opacity,transform] duration-200 motion-reduce:transition-none',
          admin ? 'bottom-20 lg:hidden' : 'md:hidden',
          hidden && 'translate-y-6 opacity-0',
        )}
      >
        <BackButton
          fallbackHref={admin ? '/admin/trips' : '/trips'}
          className="min-h-9 rounded-full px-4 py-2 text-xs text-foreground/70 whitespace-nowrap"
        />
        <Button
          size="sm"
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onSaveDraft}
          className="rounded-full px-3 text-xs whitespace-nowrap"
        >
          {isSavingDraft ? 'Saving…' : 'Save draft'}
        </Button>
        <Button
          size="sm"
          type="submit"
          form="trip-event-form"
          disabled={busy}
          className="rounded-full px-4 text-xs whitespace-nowrap"
        >
          {isSubmitting ? 'Posting…' : '+ Post'}
        </Button>
      </ThumbNavigationBar>
    </div>
  )
}
