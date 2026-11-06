import type { ReviewQueue as Queue } from '@/lib/guardian/schema'
import { ReviewCard } from './review-card'
import { WithdrawalRow } from './withdrawal-row'

const tripDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  })

function Group({
  id,
  title,
  count,
  children,
}: {
  id: string
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2
        id={id}
        className="flex items-baseline gap-3 font-brand text-3xl font-bold uppercase leading-none tracking-wide"
      >
        {title}
        <span className="font-sans text-base font-normal text-muted-foreground">
          {count}
        </span>
      </h2>
      {children}
    </section>
  )
}

/** Electronic guardian consent: what needs a decision, what was withdrawn, who is still waiting. */
export function ReviewQueue({ queue }: { queue: Queue }) {
  return (
    <div data-trip-surface className="space-y-12">
      <Group
        id="queue-review"
        title="Needs a decision"
        count={queue.requests.length}
      >
        {queue.requests.length ? (
          <div className="space-y-14">
            {queue.requests.map(request => (
              <ReviewCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <p className="border-t border-foreground/80 pt-5 text-base text-muted-foreground">
            Nothing to review. Returning guardians you’ve verified are accepted
            automatically.
          </p>
        )}
      </Group>
      {queue.withdrawals.length > 0 && (
        <Group
          id="queue-withdrawals"
          title="Withdrawn by a guardian"
          count={queue.withdrawals.length}
        >
          <ul className="divide-y divide-border border-y border-foreground/80">
            {queue.withdrawals.map(item => (
              <WithdrawalRow key={item.id} item={item} />
            ))}
          </ul>
        </Group>
      )}
      <Group
        id="queue-waiting"
        title="Waiting on a guardian"
        count={queue.waiting.length}
      >
        {queue.waiting.length ? (
          <ul className="divide-y divide-border border-y border-foreground/80">
            {queue.waiting.map(item => (
              <li
                key={`${item.participantName}-${item.tripTitle}-${item.startsAt}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
              >
                <span className="font-medium">{item.participantName}</span>
                <span className="text-sm text-muted-foreground">
                  {item.tripTitle} · {tripDay(item.startsAt)} ·{' '}
                  {item.invited ? 'Link sent' : 'Not requested yet'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-foreground/80 pt-5 text-base text-muted-foreground">
            No minors on upcoming trips are missing a guardian signature.
          </p>
        )}
      </Group>
    </div>
  )
}

export function ReviewQueueSkeleton() {
  return (
    <output
      data-trip-surface
      aria-label="Loading guardian reviews"
      className="block space-y-12"
    >
      {[0, 1].map(group => (
        <span key={group} className="block space-y-4">
          <span className="block h-8 w-64 animate-pulse bg-muted" />
          <span className="block space-y-3 border-t border-foreground/80 pt-5">
            <span className="block h-7 w-48 animate-pulse bg-muted" />
            <span className="block border-y border-border">
              {[0, 1, 2, 3].map(row => (
                <span
                  key={row}
                  className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-t border-border py-3 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
                >
                  <span className="block h-4 w-20 animate-pulse bg-muted" />
                  <span className="block h-5 animate-pulse bg-muted" />
                </span>
              ))}
            </span>
            <span className="block h-12 w-40 animate-pulse bg-muted" />
          </span>
        </span>
      ))}
    </output>
  )
}
