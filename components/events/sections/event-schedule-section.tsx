import { Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EventFormValues } from '@/lib/events/schema'

interface EventScheduleSectionProps {
  values: EventFormValues
  fieldErrors: Record<string, string>
  onFieldChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
}

export function EventScheduleSection({
  values,
  fieldErrors,
  onFieldChange,
}: EventScheduleSectionProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Schedule
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="startAt">Start</Label>
            <Input
              id="startAt"
              type="datetime-local"
              value={values.startAt}
              onChange={e => onFieldChange('startAt', e.target.value)}
            />
            {fieldErrors.startAt && (
              <p className="text-xs text-red-500">{fieldErrors.startAt}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endAt">End</Label>
            <Input
              id="endAt"
              type="datetime-local"
              value={values.endAt}
              onChange={e => onFieldChange('endAt', e.target.value)}
            />
            {fieldErrors.endAt && (
              <p className="text-xs text-red-500">{fieldErrors.endAt}</p>
            )}
          </div>
        </div>

        <div className="grid gap-2 md:max-w-xs">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={values.timezone}
            onChange={e => onFieldChange('timezone', e.target.value)}
          />
          {fieldErrors.timezone && (
            <p className="text-xs text-red-500">{fieldErrors.timezone}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
