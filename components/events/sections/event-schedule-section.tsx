import { Calendar, Globe2 } from 'lucide-react'
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
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Calendar className="h-4 w-4" />
        When
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid min-w-0 max-w-xs gap-2">
          <Label htmlFor="startAt">Start</Label>
          <Input
            id="startAt"
            type="datetime-local"
            className="w-full min-w-0 max-w-full"
            value={values.startAt}
            onChange={e => onFieldChange('startAt', e.target.value)}
          />
          {fieldErrors.startAt && (
            <p className="text-xs text-red-500">{fieldErrors.startAt}</p>
          )}
        </div>
        <div className="grid min-w-0 max-w-xs gap-2">
          <Label htmlFor="endAt">End</Label>
          <Input
            id="endAt"
            type="datetime-local"
            className="w-full min-w-0 max-w-full"
            value={values.endAt}
            onChange={e => onFieldChange('endAt', e.target.value)}
          />
          {fieldErrors.endAt && (
            <p className="text-xs text-red-500">{fieldErrors.endAt}</p>
          )}
        </div>
      </div>

      <div className="grid gap-2 md:max-w-xs">
        <Label htmlFor="timezone" className="inline-flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
          Timezone
        </Label>
        <Input
          id="timezone"
          value={values.timezone}
          onChange={e => onFieldChange('timezone', e.target.value)}
        />
        {fieldErrors.timezone && (
          <p className="text-xs text-red-500">{fieldErrors.timezone}</p>
        )}
      </div>
    </section>
  )
}
