import { waiverDate } from '@/lib/guardian/presentation'
import type { OpenGuardianRequest } from '@/lib/guardian/schema'
import { FactRow } from './ui'

const tripDate = (iso: string, timeZone: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

/** "Through March 17, 2027 (the day before Riley turns 18)" when that ends early. */
export function coversLine(
  validUntil: string,
  waiverUntil: string,
  firstName: string,
): string {
  return validUntil < waiverUntil
    ? `Through ${waiverDate(validUntil)} (the day before ${firstName} turns 18)`
    : `Through ${waiverDate(validUntil)}`
}

/** What this request asks for (or recorded), in one framed ticket. */
export function RequestSummary({
  view,
  validUntil,
}: {
  view: OpenGuardianRequest
  /** Known once signed (or once a birth date is entered): replaces the waiver year. */
  validUntil?: string | null
}) {
  const first = view.participantName.split(' ')[0]
  const signed = view.state === 'signed'
  const documents = [
    view.membership ? 'Membership permission' : null,
    view.waiver ? 'Annual activity waiver' : null,
  ].filter(Boolean)
  return (
    <dl className="border-y-2 border-foreground">
      <FactRow label="For">
        <span className="font-semibold">{view.participantName}</span>
      </FactRow>
      <FactRow label={signed ? 'Signed' : 'Signing'}>
        {documents.join(' + ')}
      </FactRow>
      {view.waiver && (
        <>
          <FactRow label="Activities">
            <span className="capitalize">
              {view.waiver.activities.join(', ')}
            </span>
          </FactRow>
          {validUntil ? (
            <FactRow label="Covers">
              {coversLine(validUntil, view.waiver.until, first)}
            </FactRow>
          ) : (
            <FactRow label="Waiver year">
              {waiverDate(view.waiver.from)} – {waiverDate(view.waiver.until)}
            </FactRow>
          )}
        </>
      )}
      {view.trip && !signed && (
        <FactRow label="First trip">
          {view.trip.title} · {tripDate(view.trip.startsAt, view.trip.timeZone)}
        </FactRow>
      )}
    </dl>
  )
}
