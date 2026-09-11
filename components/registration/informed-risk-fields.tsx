'use client'
import { riskActivities } from '@/lib/registration/risk-activities'

export function InformedRiskFields({
  risks,
  activities,
  onRisks,
  onActivities,
  error,
}: {
  risks: string
  activities: string[]
  onRisks: (value: string) => void
  onActivities: (value: string[]) => void
  error?: string
}) {
  const none = activities.includes('none')
  return (
    <div className="space-y-4">
      <p>
        Select the activities participants should understand. Each activity
        includes a suggested risk description. Add any trip-specific conditions
        below.
      </p>
      <fieldset
        aria-describedby="risk-selection-error"
        aria-invalid={Boolean(error)}
        className="space-y-2"
      >
        <legend className="mb-2 font-medium">
          Activities on this trip (required)
        </legend>
        {[
          ...new Set([
            ...riskActivities.map(option => option.value),
            ...activities.filter(activity => activity !== 'none'),
          ]),
        ].map(activity => (
          <label key={activity} className="flex min-h-10 items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0"
              checked={activities.includes(activity)}
              onChange={event =>
                onActivities(
                  event.target.checked
                    ? [
                        ...activities.filter(value => value !== 'none'),
                        activity,
                      ]
                    : activities.filter(value => value !== activity),
                )
              }
            />
            <span>
              <span className="capitalize">{activity}</span>
              {activities.includes(activity) && (
                <span className="mt-1 block text-sm text-muted-foreground">
                  {
                    riskActivities.find(option => option.value === activity)
                      ?.description
                  }
                </span>
              )}
            </span>
          </label>
        ))}
        <label className="flex min-h-10 items-center gap-3">
          <input
            type="checkbox"
            className="size-5"
            checked={none}
            onChange={event =>
              onActivities(event.target.checked ? ['none'] : [])
            }
          />
          No risk disclosure needed
        </label>
        <p
          id="risk-selection-error"
          role={error ? 'alert' : undefined}
          className="min-h-10 text-sm text-destructive"
        >
          {error}
        </p>
        {!none && (
          <label className="block">
            Other activity (requires separate scope review)
            <input
              className="mt-2 w-full rounded border bg-background p-2"
              onBlur={event => {
                const value = event.target.value.trim().toLowerCase()
                if (value && value !== 'none' && !activities.includes(value))
                  onActivities([...activities, value])
                event.target.value = ''
              }}
            />
          </label>
        )}
      </fieldset>
      {!none && (
        <label className="block space-y-2">
          <span>Additional trip-specific risks and conditions (optional)</span>
          <textarea
            className="min-h-32 w-full rounded border bg-background p-3"
            value={risks}
            onChange={event => onRisks(event.target.value)}
            maxLength={4000}
          />
          <span className="block text-sm text-muted-foreground">
            Add up to four concise statements, one per line. Other activities
            need a description. This is separate from the liability waiver.
          </span>
        </label>
      )}
      {none && (
        <p className="text-sm text-muted-foreground">
          Participants will skip the informed-risk step. Any required liability
          waiver still applies.
        </p>
      )}
    </div>
  )
}
