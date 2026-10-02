import type { ClimbingAccessNotice } from '@/lib/kraft/access-notices'
import styles from './access-notice.module.css'

function displayDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function AccessNotice({
  notice,
  compact = false,
}: {
  notice: ClimbingAccessNotice | null
  compact?: boolean
}) {
  if (!notice) return null
  return (
    <aside
      className={compact ? styles.compact : styles.notice}
      aria-label="Climbing access notice"
    >
      <strong>Climbing closed{compact && ' · historical route record'}</strong>
      {!compact && <p>{notice.summary}</p>}
      <p className={styles.source}>
        <a href={notice.source.url} target="_blank" rel="noreferrer">
          {notice.source.publisher} · {notice.source.title}
        </a>
        {' · Source checked '}
        <time dateTime={notice.source.checkedAt}>
          {displayDate(notice.source.checkedAt)}
        </time>
        .
      </p>
      {!compact && (
        <details>
          <summary>Closure source details</summary>
          <p>
            The published notice says BLM installed two closure signs on{' '}
            <time dateTime={notice.reportedSignDate}>
              {displayDate(notice.reportedSignDate)}
            </time>
            . Please respect the closure. The four routes remain in this guide
            as historical records. Access has not been checked in the field or
            reconfirmed with BLM.
          </p>
        </details>
      )}
    </aside>
  )
}
