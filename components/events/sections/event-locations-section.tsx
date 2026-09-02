import { MapPin, MapPinned, Navigation } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EventFormValues } from '@/lib/events/schema'

interface EventLocationsSectionProps {
  values: EventFormValues
  fieldErrors: Record<string, string>
  onFieldChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
}

export function EventLocationsSection({
  values,
  fieldErrors,
  onFieldChange,
}: EventLocationsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <MapPin className="h-4 w-4" />
        Where
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label
            htmlFor="primaryLocation"
            className="inline-flex items-center gap-1.5"
          >
            <MapPinned className="h-3.5 w-3.5 text-muted-foreground" />
            Primary location
          </Label>
          <Input
            id="primaryLocation"
            value={values.primaryLocationName}
            onChange={e => onFieldChange('primaryLocationName', e.target.value)}
          />
          {fieldErrors.primaryLocationName && (
            <p className="text-xs text-red-500">
              {fieldErrors.primaryLocationName}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label
            htmlFor="meetingLocation"
            className="inline-flex items-center gap-1.5"
          >
            <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
            Meeting location
          </Label>
          <Input
            id="meetingLocation"
            value={values.meetingLocationName ?? ''}
            onChange={e => onFieldChange('meetingLocationName', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label
          htmlFor="locationNotes"
          className="inline-flex items-center gap-1.5"
        >
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          Meetup details
        </Label>
        <Textarea
          id="locationNotes"
          value={values.locationNotes ?? ''}
          onChange={e => onFieldChange('locationNotes', e.target.value)}
          rows={3}
        />
      </div>
    </section>
  )
}
