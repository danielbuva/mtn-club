import type { GuideSection } from '@/app/(reader)/guides/types'
import { SectionsDrawer } from '@/components/start-here/SectionsDrawer'
import { StickyChapter } from '@/components/start-here/StickyChapter'

type GuideShellProps = {
  sections: GuideSection[]
}

export function GuideShell({ sections }: GuideShellProps) {
  return (
    <div className="min-h-screen text-foreground">
      <main className="public-page-top">
        <div className="px-4 pb-24">
          <div className="mx-auto w-full md:flex md:justify-center md:gap-8">
            <div className="md:w-60 md:shrink-0">
              <SectionsDrawer sections={sections} />
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
