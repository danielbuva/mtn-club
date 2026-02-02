import { Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EVENT_CREATION_STATUSES,
  EVENT_VISIBILITIES,
} from '@/lib/events/constants'
import type { EventFormValues } from '@/lib/events/schema'

interface EventSettingsSectionProps {
  values: EventFormValues
  fieldErrors: Record<string, string>
  onFieldChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
}

export function EventSettingsSection({
  values,
  fieldErrors,
  onFieldChange,
}: EventSettingsSectionProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Settings className="h-4 w-4" />
          Visibility & Capacity
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Visibility</Label>
            <Select
              value={values.visibility}
              onValueChange={value =>
                onFieldChange(
                  'visibility',
                  value as EventFormValues['visibility'],
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Who can see this" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_VISIBILITIES.map(visibility => (
                  <SelectItem key={visibility} value={visibility}>
                    {visibility.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={values.isOfficial ? values.status : 'published'}
              onValueChange={value =>
                onFieldChange('status', value as EventFormValues['status'])
              }
              disabled={!values.isOfficial}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CREATION_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="maxParticipants">Max participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min={1}
              value={values.maxParticipants ?? ''}
              onChange={e => onFieldChange('maxParticipants', e.target.value)}
              placeholder="Optional"
            />
            {fieldErrors.maxParticipants && (
              <p className="text-xs text-red-500">
                {fieldErrors.maxParticipants}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
