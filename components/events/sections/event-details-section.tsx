import { Backpack, Car, CloudSun, ListChecks } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EventFormValues } from '@/lib/events/schema'

type EventDetailsSectionProps = {
  values: EventFormValues
  onFieldChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
}

export function EventDetailsSection({
  values,
  onFieldChange,
}: EventDetailsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-2">
        <Label
          htmlFor="overviewWhat"
          className="inline-flex items-center gap-1.5"
        >
          <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
          What
        </Label>
        <Textarea
          id="overviewWhat"
          value={values.overviewWhat ?? ''}
          onChange={e => onFieldChange('overviewWhat', e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="overviewWeather"
          className="inline-flex items-center gap-1.5"
        >
          <CloudSun className="h-3.5 w-3.5 text-muted-foreground" />
          Weather
        </Label>
        <Textarea
          id="overviewWeather"
          value={values.overviewWeather ?? ''}
          onChange={e => onFieldChange('overviewWeather', e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="overviewEquipment"
          className="inline-flex items-center gap-1.5"
        >
          <Backpack className="h-3.5 w-3.5 text-muted-foreground" />
          Equipment
        </Label>
        <Textarea
          id="overviewEquipment"
          value={values.overviewEquipment ?? ''}
          onChange={e => onFieldChange('overviewEquipment', e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="overviewCarpoolNeedGear"
          className="inline-flex items-center gap-1.5"
        >
          <Car className="h-3.5 w-3.5 text-muted-foreground" />
          Carpool / Need Gear
        </Label>
        <Textarea
          id="overviewCarpoolNeedGear"
          value={values.overviewCarpoolNeedGear ?? ''}
          onChange={e =>
            onFieldChange('overviewCarpoolNeedGear', e.target.value)
          }
          rows={3}
        />
      </div>
    </section>
  )
}
