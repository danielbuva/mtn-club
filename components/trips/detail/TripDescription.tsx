import type { TripDetail } from '@/lib/trips/types'
import { DashList } from './dash-list'
import { FieldLabel, TripSection } from './trip-section'

type TripDescriptionProps = {
  trip: TripDetail
}

function listItems(value: string) {
  return value
    .split(/[\n;]+/)
    .map(item => item.trim().replace(/^[-•*]\s*/, ''))
    .filter(Boolean)
}

export function TripDescription({ trip }: TripDescriptionProps) {
  const description = trip.description?.trim()
  const rows = [
    { label: 'What', value: trip.overviewWhat?.trim(), list: false },
    { label: 'Where', value: trip.overviewWhere?.trim(), list: false },
    { label: 'Weather', value: trip.overviewWeather?.trim(), list: false },
    {
      label: 'What to bring',
      value: trip.overviewEquipment?.trim(),
      list: true,
    },
    {
      label: 'Carpools & borrowing gear',
      value: trip.overviewCarpoolNeedGear?.trim(),
      list: false,
    },
  ].filter(row => Boolean(row.value))

  return (
    <TripSection id="trip-overview" title="Overview">
      {description ? (
        <div className="max-w-prose space-y-3 text-base leading-7">
          {description
            .split(/\n{2,}|\n/)
            .filter(Boolean)
            .map((line, index) => (
              <p key={`${index}-${line.slice(0, 24)}`}>{line}</p>
            ))}
        </div>
      ) : null}
      {rows.length ? (
        <dl className="grid max-w-prose gap-5">
          {rows.map(row => (
            <div key={row.label} className="space-y-1.5">
              <dt>
                <FieldLabel>{row.label}</FieldLabel>
              </dt>
              <dd className="text-base leading-7">
                {row.list ? (
                  <DashList items={listItems(row.value ?? '')} />
                ) : (
                  <p className="whitespace-pre-line">{row.value}</p>
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {!description && !rows.length ? (
        <p className="text-base text-muted-foreground">
          The trip leader hasn’t posted full details yet. Check back closer to
          the trip, or ask in the club Discord.
        </p>
      ) : null}
    </TripSection>
  )
}
