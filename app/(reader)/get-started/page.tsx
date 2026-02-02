import { sections } from '@/app/(reader)/get-started/sections'
import { ChaptersDrawer } from '@/components/get-started/ChaptersDrawer'
import { StickyChapter } from '@/components/get-started/StickyChapter'

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ChaptersDrawer sections={sections} />
      <main className="pt-12">
        <article className="px-4 pb-24">
          <div className="mx-auto max-w-215">
            {sections.map((section, index) => (
              <StickyChapter
                key={section.id}
                section={section}
                nextId={sections[index + 1]?.id}
              />
            ))}
          </div>
        </article>
      </main>
    </div>
  )
}
