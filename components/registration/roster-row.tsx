'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  RegistrationCommand,
  RegistrationRoster,
} from '@/lib/registration/schema'
import { transportationLabel } from '@/lib/registration/transportation'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'

export function RosterRow({
  row,
  snapshot,
}: {
  row: RegistrationRoster['rows'][number]
  snapshot: RegistrationRoster['snapshot']
}) {
  const { run, message, pending } = useRegistrationCommand(snapshot.tripId)
  const [note, setNote] = useState('')
  const format = (value: string | null) =>
    value
      ? new Date(value).toLocaleString('en-US', { timeZone: snapshot.timeZone })
      : 'Not submitted'
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
  return (
    <article className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="font-semibold">{row.name}</h3>
        <span className="capitalize">
          {row.state === 'incomplete'
            ? 'Signup incomplete'
            : row.state.replaceAll('_', ' ')}
        </span>
      </div>
      <p className="text-sm">
        Registered: {format(row.registeredAt)} · Queue: {format(row.queuedAt)} (
        {snapshot.timeZone})
      </p>
      {row.requirements.length ? (
        <ul className="list-inside list-disc text-sm">
          {row.requirements.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">Requirements complete</p>
      )}
      <p className="text-sm">
        {row.emailEnabled
          ? 'Email notifications enabled'
          : 'Email disabled — this person must check the app for offers'}
      </p>
      <div className="flex flex-wrap gap-2">
        {['waitlisted', 'legacy_review'].includes(row.state) ? (
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
            Revoke offer
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
      </div>
      <details className="space-y-3">
        <summary className="cursor-pointer text-sm underline">
          Participant details and organizer actions
        </summary>
        <dl className="space-y-2 text-sm">
          <dt className="font-medium">Shared contact</dt>
          <dd>
            {row.email ?? 'Email not shared'} ·{' '}
            {row.phone ?? 'Phone not shared'}
          </dd>
          <dt className="font-medium">Transportation preferences</dt>
          <dd>{transportationLabel(row.transportation)}</dd>
          <dt className="font-medium">Emergency contact</dt>
          <dd>
            {[
              row.emergencyContact.name,
              row.emergencyContact.relationship,
              row.emergencyContact.phone,
              row.emergencyContact.notes,
            ]
              .filter(Boolean)
              .join(' · ') || 'Not provided'}
          </dd>
          {Object.entries(row.answers).map(([key, value]) => (
            <div key={key}>
              <dt className="font-medium">
                {snapshot.questions.find(q => q.id === key)?.label ?? key}
              </dt>
              <dd>
                {Array.isArray(value) ? value.join(', ') : String(value ?? '')}
              </dd>
            </div>
          ))}
        </dl>
        {row.state === 'confirmed' ? (
          <div className="space-y-2">
            <Label htmlFor={`attendance-${row.userId}`}>Attendance</Label>
            <select
              id={`attendance-${row.userId}`}
              className="w-full rounded border bg-background p-2"
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
              <option value="unmarked">Unmarked</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor={`note-${row.userId}`}>
            Removal reason or guardian consent evidence
          </Label>
          <Input
            id={`note-${row.userId}`}
            value={note}
            maxLength={2000}
            onChange={event => setNote(event.target.value)}
          />
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
        <h4 className="text-sm font-medium">Offer history</h4>
        {row.offers.map(offer => (
          <p key={offer.id} className="text-sm">
            {offer.status} · issued {format(offer.issuedAt)} · expires{' '}
            {format(offer.expiresAt)}
          </p>
        ))}
        <h4 className="text-sm font-medium">Email delivery</h4>
        {row.delivery.map(delivery => (
          <p key={delivery.id} className="text-sm">
            {delivery.kind.replaceAll('_', ' ')}: {delivery.status}
            {delivery.errorCode ? ` (${delivery.errorCode})` : ''}
          </p>
        ))}
      </details>
      <output className="text-sm">{message}</output>
    </article>
  )
}
