import { Suspense } from 'react'
import type { GuideSection } from '@/app/(reader)/guides/types'
import { SectionsDrawer } from '@/components/start-here/SectionsDrawer'
import { StickyChapter } from '@/components/start-here/StickyChapter'
import { getViewer } from '@/lib/auth/viewer'

type GuideShellProps = {
  sections: GuideSection[]
}

async function GuideNavigation({ sections }: GuideShellProps) {
  const viewer = await getViewer()
  return (
    <SectionsDrawer
      sections={sections}
      canCreateEvent={viewer.canCreateEvent}
    />
  )
}

export function GuideShell({ sections }: GuideShellProps) {
  return (
    <div className="min-h-screen text-foreground">
      <main className="public-page-top">
        <div className="px-4 pb-24">
          <div className="mx-auto w-full md:flex md:justify-center md:gap-8">
            <div className="md:w-60 md:shrink-0">
              <Suspense
                fallback={
                  <SectionsDrawer sections={sections} canCreateEvent={false} />
                }
              >
                <GuideNavigation sections={sections} />
              </Suspense>
            </div>
            <article className="w-full max-w-215" data-guide-scroll>
              {sections.map(section => (
                <StickyChapter key={section.id} section={section} />
              ))}
            </article>
          </div>
        </div>
      </main>
    </div>
  )
}
