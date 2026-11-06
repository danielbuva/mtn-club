import type { ReactNode } from 'react'
import type { RosterRow } from '@/lib/registration/roster-status'
import type { RegistrationRoster } from '@/lib/registration/schema'
import { transportationLabel } from '@/lib/registration/transportation'

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm leading-5">{children}</dd>
    </div>
  )
}

function answerText(value: RosterRow['answers'][string]) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (Array.isArray(value))
    return value.length ? value.join(', ') : 'None selected'
  return value?.trim() ? value : 'No answer'
}

function formatMoment(value: string | null, timeZone: string) {
  if (!value) return null
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value))
}

export function RosterDetails({
  row,
  snapshot,
  waitlistPosition,
}: {
  row: RosterRow
  snapshot: RegistrationRoster['snapshot']
  waitlistPosition?: number
}) {
  const emergency = [
    row.emergencyContact.name,
    row.emergencyContact.relationship,
    row.emergencyContact.phone,
  ]
    .filter(Boolean)
    .join(' · ')
  const signedUp = formatMoment(row.registeredAt, snapshot.timeZone)
  return (
    <dl className="space-y-2.5">
      <Detail label="Discord">
        {row.discord?.username ? (
          <>
            <span className="select-all font-medium">
              @{row.discord.username}
            </span>
            {row.discord.globalName &&
            row.discord.globalName !== row.discord.username ? (
              <span className="text-muted-foreground">
                {' '}
                · shows as {row.discord.globalName}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-muted-foreground">
            No Discord account linked
          </span>
        )}
      </Detail>
      <Detail label="Contact">
        {row.email || row.phone ? (
          [row.email, row.phone].filter(Boolean).join(' · ')
        ) : (
          <span className="text-muted-foreground">Not shared</span>
        )}
      </Detail>
      {signedUp ? <Detail label="Signed up">{signedUp}</Detail> : null}
      {waitlistPosition ? (
        <Detail label="Waitlist">#{waitlistPosition} in line</Detail>
      ) : null}
      {row.requirements.length ? (
        <Detail label="Still needs">
          <ul className="list-disc space-y-0.5 pl-4">
            {row.requirements.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Detail>
      ) : null}
      {snapshot.collectTransportation ? (
        <Detail label="Getting there">
          {transportationLabel(row.transportation)}
        </Detail>
      ) : null}
      {Object.entries(row.answers).map(([key, value]) => (
        <Detail
          key={key}
          label={
            snapshot.questions.find(question => question.id === key)?.label ??
            key
          }
        >
          {answerText(value)}
        </Detail>
      ))}
      <Detail label="Emergency">
        {emergency || (
          <span className="text-muted-foreground">Not provided</span>
        )}
      </Detail>
      <Detail label="Attendee list">
        {row.showInAttendeeList ? 'Listed for members' : 'Hidden from members'}
      </Detail>
      {!row.emailEnabled ? (
        <Detail label="Email">
          <span className="text-muted-foreground">
            Off. They won’t get seat offers by email.
          </span>
        </Detail>
      ) : null}
    </dl>
  )
}
