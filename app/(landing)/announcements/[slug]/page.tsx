import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AnnouncementArchive } from '@/components/announcements/announcement-archive'
import { AnnouncementContent } from '@/components/announcements/announcement-content'
import { AnnouncementLoading } from '@/components/announcements/announcement-loading'
import {
  getActiveAnnouncement,
  getAnnouncementBySlug,
  getPublishedAnnouncements,
} from '@/lib/announcements/queries'

type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getAnnouncementBySlug(slug)
  if (!item) notFound()
  return {
    title: `${item.title} | UNLV Mountain Club`,
    description: item.description || item.subtitle,
    alternates: { canonical: `/announcements/${item.slug}` },
    openGraph: {
      title: item.title,
      description: item.description || item.subtitle,
      url: `/announcements/${item.slug}`,
      type: 'article',
    },
  }
}
async function Notice({ params }: Props) {
  const { slug } = await params
  const [item, active, announcements] = await Promise.all([
    getAnnouncementBySlug(slug),
    getActiveAnnouncement(),
    getPublishedAnnouncements(),
  ])
  if (!item) notFound()
  return (
    <>
      {active && active.id !== item.id && (
        <Link
          prefetch={false}
          className="mb-8 inline-block font-brand underline underline-offset-4"
          href={`/announcements/${active.slug}`}
        >
          Current notice: {active.title} →
        </Link>
      )}
      <AnnouncementContent
        announcement={item}
        past={Date.parse(item.ends_at) <= Date.now()}
      />
      <AnnouncementArchive
        announcements={announcements}
        currentId={active?.id}
        selectedId={item.id}
      />
    </>
  )
}
export default function Page(props: Props) {
  return (
    <Suspense fallback={<AnnouncementLoading />}>
      <Notice {...props} />
    </Suspense>
  )
}
