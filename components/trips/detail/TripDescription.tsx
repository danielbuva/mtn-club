import type { TripDetail } from '@/lib/trips/types'

type TripDescriptionProps = {
  trip: TripDetail
}

export function TripDescription({ trip }: TripDescriptionProps) {
  const description = trip.description?.trim()
  const sectionRows = [
    { label: 'What', value: trip.overviewWhat?.trim() },
    { label: 'Where', value: trip.overviewWhere?.trim() },
    { label: 'Weather', value: trip.overviewWeather?.trim() },
    { label: 'Equipment', value: trip.overviewEquipment?.trim() },
    {
      label: 'Carpool/Need Gear',
      value: trip.overviewCarpoolNeedGear?.trim(),
    },
  ].filter(row => Boolean(row.value))

  return (
    <section className="space-y-2 rounded-2xl border border-border/70 bg-card p-4 md:p-5">
      <h2 className="text-lg font-semibold">Overview</h2>
      {trip.eventKind && (
        <p className="text-xs capitalize text-muted-foreground">
          {trip.eventKind}
        </p>
      )}
      {sectionRows.length ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          {description ? (
            <p className="whitespace-pre-line">{description}</p>
          ) : null}
          {sectionRows.map(row => (
            <div key={row.label} className="space-y-1">
              <p className="font-semibold text-foreground">{row.label}:</p>
              {row.label === 'Equipment' ? (
                <div className="whitespace-pre-line">
                  {(row.value ?? '')
                    .split(/[\n;]+/)
                    .map(item => item.trim())
                    .filter(Boolean)
                    .map(item => (item.startsWith('-') ? item : `- ${item}`))
                    .join('\n')}
                </div>
              ) : (
                <p className="whitespace-pre-line">{row.value}</p>
              )}
            </div>
          ))}
        </div>
      ) : description ? (
        <div className="space-y-3 text-sm text-muted-foreground">
          {description
            .split('\n')
            .filter(Boolean)
            .map(line => (
              <p key={line}>{line}</p>
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Full details will be posted soon.
        </p>
      )}
    </section>
  )
}
