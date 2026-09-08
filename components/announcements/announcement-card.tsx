import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { AnnouncementSummary } from '@/lib/announcements/types'
import styles from './announcement.module.css'

export function AnnouncementCard({
  announcement,
  preview = false,
}: {
  announcement: AnnouncementSummary
  preview?: boolean
}) {
  const content = (
    <>
      <ArrowUpRight aria-hidden="true" className={styles.arrow} />
      <span className={styles.kicker}>
        {announcement.author_name
          ? `From ${announcement.author_name}`
          : 'Club notice'}
      </span>
      <h2 className={styles.title}>{announcement.title}</h2>
      {announcement.subtitle && (
        <p className={styles.subtitle}>{announcement.subtitle}</p>
      )}
      <div className={styles.footer}>
        <p>{announcement.description || 'Read the club notice.'}</p>
      </div>
    </>
  )
  return preview ? (
    <div className={styles.paper}>{content}</div>
  ) : (
    <Link
      prefetch={false}
      href={`/announcements/${announcement.slug}`}
      className={styles.paper}
    >
      {content}
    </Link>
  )
}
