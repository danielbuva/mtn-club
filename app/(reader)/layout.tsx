import { Suspense } from 'react'
import { ThumbNavigationBar } from '@/components/navigation/thumb-navigation'
import { ReaderFloatingBackButton } from '@/components/reader-floating-back-button'
import { getViewer } from '@/lib/auth/viewer'

async function ReaderFloatingNavigation() {
  const viewer = await getViewer()
  return <ReaderFloatingBackButton canCreateEvent={viewer.canCreateEvent} />
}

function ReaderNavigationFallback() {
  return (
    <ThumbNavigationBar showTheme={false}>
      <span
        className="block h-9 w-20 animate-pulse rounded-full bg-muted"
        aria-hidden="true"
      />
      <span className="sr-only">Loading page actions</span>
    </ThumbNavigationBar>
  )
}

export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      data-editorial-surface
      data-overscroll-tone="paper"
      className="min-h-screen bg-background text-foreground"
    >
      <Suspense fallback={<ReaderNavigationFallback />}>
        <ReaderFloatingNavigation />
      </Suspense>
      {children}
    </div>
  )
}
