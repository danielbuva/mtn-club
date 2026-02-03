import { sections } from '@/app/(reader)/starter-guide/sections'
import { ChaptersDrawer } from '@/components/starter-guide/ChaptersDrawer'
import { StickyChapter } from '@/components/starter-guide/StickyChapter'

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
