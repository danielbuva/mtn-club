import { Button } from '@/components/ui/button'
import type { RegistrationValues } from '@/lib/registration/form-values'
import { normalizeRegistrationValues } from '@/lib/registration/form-values'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { transportationLabel } from '@/lib/registration/transportation'

export function RegistrationReview({
  snapshot,
  values,
  onEdit,
}: {
  snapshot: TripRegistrationSnapshot
  values: RegistrationValues
  onEdit: (id: string) => void
}) {
  const normalized = normalizeRegistrationValues(values, snapshot, 'submit')
  const rows = [
    ...snapshot.questions.map(question => {
      const value = normalized.answers?.[question.id]
      const answer = Array.isArray(value)
        ? value.join(', ')
        : typeof value === 'boolean'
          ? value
            ? 'Yes'
            : 'No'
          : String(value ?? 'Not provided')
      return { id: `question:${question.id}`, title: question.label, answer }
    }),
    ...(snapshot.collectTransportation
      ? [
          {
            id: 'transportation',
            title: 'Transportation',
            answer: transportationLabel(normalized.transportation ?? null),
          },
        ]
      : []),
    {
      id: 'emergency',
      title: 'Emergency contact',
      answer:
        Object.values(values.emergencyContact).filter(Boolean).join(' · ') ||
        'Not provided',
    },
    {
      id: 'preferences',
      title: 'Joining preferences',
      answer: `${values.showInAttendeeList ? 'Visible in attendee lists' : 'Hidden from attendee lists'} · Trip emails ${values.emailUpdates ? 'on' : 'off'}${snapshot.emailAllowed ? '' : ' (all account emails are disabled)'}`,
    },
    ...(snapshot.waiverRequired
      ? [
          {
            id: 'waiver',
            title: 'Waiver',
            answer: snapshot.waiverSigned
              ? 'Already signed'
              : snapshot.ageAdult === false
                ? 'Guardian verification required'
                : values.waiverAgreed
                  ? `Ready to sign as ${values.signatureName}`
                  : 'Review required',
          },
        ]
      : []),
  ]
  return (
    <div className="divide-y divide-foreground/15">
      {rows.map(row => (
        <div key={row.id} className="py-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-medium">{row.title}</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onEdit(row.id)}
              aria-label={`Edit ${row.title}`}
            >
              Edit
            </Button>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {row.answer || 'Not provided'}
          </p>
        </div>
      ))}
    </div>
  )
}
