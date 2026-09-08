import type { AnnouncementSummary } from '@/lib/announcements/types'
import { AnnouncementCard } from './announcement-card'
import { AnnouncementContent } from './announcement-content'
export function AnnouncementPreview({
  announcement,
}: {
  announcement: AnnouncementSummary & { content: string }
}) {
  return (
    <details className="border border-border p-5">
      <summary className="cursor-pointer font-brand text-xl uppercase">
        Preview notice & full page
      </summary>
      <div className="mt-6 space-y-8">
        <div>
          <h3 className="mb-4 font-brand uppercase">Desktop paper</h3>
          <div className="max-w-[410px] p-3">
            <AnnouncementCard announcement={announcement} preview />
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-brand uppercase">Mobile paper</h3>
          <div className="w-[280px] max-w-full p-3">
            <AnnouncementCard announcement={announcement} preview />
          </div>
        </div>
        <div className="border-t border-border pt-8">
          <AnnouncementContent announcement={announcement} />
        </div>
      </div>
    </details>
  )
}
