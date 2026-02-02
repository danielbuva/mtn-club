import { MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Locations
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="primaryLocation">Primary location</Label>
            <Input
              id="primaryLocation"
              value={values.primaryLocationName}
              onChange={e =>
                onFieldChange('primaryLocationName', e.target.value)
              }
              placeholder="Trailhead, park, venue"
            />
            {fieldErrors.primaryLocationName && (
              <p className="text-xs text-red-500">
                {fieldErrors.primaryLocationName}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="meetingLocation">Meeting location</Label>
            <Input
              id="meetingLocation"
              value={values.meetingLocationName ?? ''}
              onChange={e =>
                onFieldChange('meetingLocationName', e.target.value)
              }
              placeholder="Optional meetup spot"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
