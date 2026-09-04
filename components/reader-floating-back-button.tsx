'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BackButton } from '@/components/back-button'
import { PublicThumbNavigation } from '@/components/navigation/public-thumb-navigation'
import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'
import { Button } from '@/components/ui/button'

const guidePaths = new Set(['/learn-more', '/cost', '/faq', '/gear', '/safety'])

export function ReaderFloatingBackButton({
  canCreateEvent,
}: {
  canCreateEvent: boolean
}) {
  const pathname = usePathname()
  const isTripsNewPage = pathname === '/trips/new'
  const isTripDetailPage =
    pathname.startsWith('/trips/') &&
    pathname !== '/trips/new' &&
    pathname !== '/trips/drafts'

  if (pathname === '/calendar') {
    return <PublicThumbNavigation />
  }

  if (
    guidePaths.has(pathname) ||
    isTripDetailPage ||
    (isTripsNewPage && canCreateEvent)
  ) {
    return null
  }

  return (
    <ThumbNavigationBar showTheme={false}>
      <BackButton className="min-h-9 rounded-full px-4 py-2 text-xs text-foreground/70 whitespace-nowrap" />
      {canCreateEvent ? (
        <Button
          asChild
          size="sm"
          className="rounded-full px-4 text-xs whitespace-nowrap"
        >
          <Link href="/trips/new">+ Event</Link>
        </Button>
      ) : null}
    </ThumbNavigationBar>
  )
}
