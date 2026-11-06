'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RosterRow } from '@/lib/registration/roster-status'
import type {
  RegistrationCommand,
  RegistrationRoster,
} from '@/lib/registration/schema'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'

function formatMoment(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function RosterActions({
  row,
  snapshot,
}: {
  row: RosterRow
  snapshot: RegistrationRoster['snapshot']
}) {
  const { run, message, pending } = useRegistrationCommand(snapshot.tripId)
  const [note, setNote] = useState('')
  const command = (action: RegistrationCommand) =>
    run({
      command: action,
      expectedRevision: row.revision,
      userId: row.userId,
      data:
        action === 'remove'
          ? { reason: note }
          : action === 'guardian_review'
            ? { evidence: note }
            : {},
    })
  const canOffer = ['waitlisted', 'legacy_review'].includes(row.state)
  return (
    <div className="space-y-4 border-t border-border pt-4">
      {canOffer ||
      row.state === 'offered' ||
      row.state === 'removed_by_organizer' ? (
        <div className="flex flex-wrap gap-2">
          {canOffer ? (
            <Button
              size="sm"
              disabled={pending || row.requirements.length > 0}
              onClick={() => command('issue_offer')}
            >
              Offer a seat
            </Button>
          ) : null}
          {row.state === 'offered' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => command('revoke_offer')}
            >
              Withdraw offer
            </Button>
          ) : null}
          {row.state === 'removed_by_organizer' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => command('restore')}
            >
              Restore registration access
            </Button>
          ) : null}
          {canOffer && row.requirements.length > 0 ? (
            <p className="basis-full text-xs text-muted-foreground">
              They need to finish the items above before you can offer a seat.
            </p>
          ) : null}
        </div>
      ) : null}

      {row.state === 'confirmed' ? (
        <div className="max-w-56 space-y-1.5">
          <Label
            htmlFor={`attendance-${row.userId}`}
            className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
          >
            Attendance
          </Label>
          <select
            id={`attendance-${row.userId}`}
            className="h-9 w-full rounded-none border border-input bg-background px-2 text-sm"
            disabled={pending}
            value={row.attendance}
            onChange={event => {
              const attendance = event.target.value
              if (
                attendance === 'present' ||
                attendance === 'absent' ||
                attendance === 'unmarked'
              )
                run({
                  command: 'attendance',
                  expectedRevision: row.revision,
                  userId: row.userId,
                  data: { attendance },
                })
            }}
          >
            <option value="unmarked">Not marked</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      ) : null}

      <details className="group space-y-3 [&:not([open])]:-mb-2">
        <summary className="inline-flex min-h-9 cursor-pointer items-center text-sm underline underline-offset-4">
          More actions
        </summary>
        <div className="space-y-1.5">
          <Label htmlFor={`note-${row.userId}`}>
            Reason for removal, or guardian consent evidence
          </Label>
          <Input
            id={`note-${row.userId}`}
            value={note}
            maxLength={2000}
            onChange={event => setNote(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            At least 5 characters. The participant sees the removal reason.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {row.state !== 'removed_by_organizer' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending || note.trim().length < 5}
              onClick={() => {
                if (
                  window.confirm(`Remove ${row.name} and release their seat?`)
                )
                  command('remove')
              }}
            >
              Remove participant
            </Button>
          ) : null}
          {snapshot.canReviewGuardian ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending || note.trim().length < 5}
              onClick={() => command('guardian_review')}
            >
              Confirm guardian consent
            </Button>
          ) : null}
        </div>
        {row.offers.length ? (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Seat offers
            </p>
            {row.offers.map(offer => (
              <p key={offer.id}>
                {offer.status} · sent{' '}
                {formatMoment(offer.issuedAt, snapshot.timeZone)} · expires{' '}
                {formatMoment(offer.expiresAt, snapshot.timeZone)}
              </p>
            ))}
          </div>
        ) : null}
        {row.delivery.length ? (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Emails
            </p>
            {row.delivery.map(delivery => (
              <p key={delivery.id}>
                {delivery.kind.replaceAll('_', ' ')}: {delivery.status}
                {delivery.errorCode ? ` (${delivery.errorCode})` : ''}
              </p>
            ))}
          </div>
        ) : null}
      </details>
      <output className="block text-sm empty:hidden">{message}</output>
    </div>
  )
}
