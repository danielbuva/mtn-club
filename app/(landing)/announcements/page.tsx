import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AnnouncementArchive } from '@/components/announcements/announcement-archive'
import { AnnouncementContent } from '@/components/announcements/announcement-content'
import { AnnouncementLoading } from '@/components/announcements/announcement-loading'
import {
  getActiveAnnouncement,
  getPublishedAnnouncements,
} from '@/lib/announcements/queries'
export const metadata: Metadata = {
  title: 'Noticeboard | UNLV Mountain Club',
  description: 'Meetings, outings, and news from the UNLV Mountain Club.',
  alternates: { canonical: '/announcements' },
}
async function Notices() {
  const [active, announcements] = await Promise.all([
    getActiveAnnouncement(),
    getPublishedAnnouncements(),
  ])
  const focused = active ?? announcements[0]
  if (!focused)
    return (
      <>
        <h1 className="font-brand text-5xl uppercase">The noticeboard</h1>
        <p className="mt-6">
          Nothing posted just yet. Check back for club news and gatherings.
        </p>
      </>
    )
  return (
    <>
      <AnnouncementContent announcement={focused} past={!active} />
      <AnnouncementArchive
        announcements={announcements}
        currentId={active?.id}
        selectedId={focused.id}
      />
    </>
  )
}
export default function Page() {
  return (
    <Suspense fallback={<AnnouncementLoading />}>
      <Notices />
    </Suspense>
  )
}
