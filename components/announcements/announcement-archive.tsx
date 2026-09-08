import Link from 'next/link'
import type { Announcement } from '@/lib/announcements/types'

export function AnnouncementArchive({
  announcements,
  currentId,
  selectedId,
}: {
  announcements: Announcement[]
  currentId?: string
  selectedId?: string
}) {
  const past = announcements.filter(
    item => item.id !== currentId && item.id !== selectedId,
  )
  return (
    <nav
      aria-label="Announcement archive"
      className="mt-16 border-t border-foreground/30 pt-6"
    >
      <h2 className="font-brand text-sm uppercase tracking-[0.2em]">
        More from the noticeboard
      </h2>
      {past.length ? (
        <div className="mt-5 divide-y divide-foreground/15">
          {past.map(item => (
            <Link
              prefetch={false}
              key={item.id}
              href={`/announcements/${item.slug}`}
              className="flex items-center justify-between gap-5 py-5 focus-visible:outline-2"
            >
              <div>
                <p className="font-brand text-xl uppercase">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.subtitle}
                </p>
              </div>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          No other notices yet. See you out there.
        </p>
      )}
    </nav>
  )
}
