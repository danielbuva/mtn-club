'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { usePublicNavigationState } from '@/components/navigation/public-navigation-state'
import {
  ThumbNavigationBar,
  thumbMenuButtonClass,
} from '@/components/navigation/thumb-navigation'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function MoreNavigation({
  tabIndex,
  menuButtonId,
  className,
  label = 'More',
}: {
  menuButtonId?: string
  label?: string
  tabIndex?: number
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { moreLinks, close } = usePublicNavigationState()

  return (
    <Sheet
      open={open}
      onOpenChange={nextOpen => {
        if (nextOpen) close()
        setOpen(nextOpen)
      }}
    >
      <SheetTrigger asChild>
        <button type="button" tabIndex={tabIndex} className={className}>
          {label}
        </button>
      </SheetTrigger>
      <SheetContent
        onCloseAutoFocus={event => {
          if (menuButtonId) {
            event.preventDefault()
            document.getElementById(menuButtonId)?.focus()
          }
        }}
        side="bottom"
        showCloseButton={false}
        className="h-dvh gap-0 border-0 motion-reduce:animate-none"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="space-y-1">
            <SheetTitle className="font-brand text-3xl uppercase">
              Explore the club
            </SheetTitle>
            <SheetDescription>
              Find your next adventure. Make yourself at home.
            </SheetDescription>
          </div>
        </div>
        <nav
          aria-label="All pages"
          className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]"
        >
          {moreLinks}
        </nav>
        <ThumbNavigationBar
          ariaLabel="Close menu"
          tone="paper"
          placement="right"
          className="gap-0 overflow-hidden rounded-none"
        >
          <SheetClose aria-label="Close" className={thumbMenuButtonClass}>
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        </ThumbNavigationBar>
      </SheetContent>
    </Sheet>
  )
}
