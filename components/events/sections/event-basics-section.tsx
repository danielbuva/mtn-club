import { ShieldCheck } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { ACTIVITY_OPTIONS, EVENT_DIFFICULTIES, EVENT_KINDS } from '@/lib/events/constants'
import type { EventFormValues } from '@/lib/events/schema'

interface EventBasicsSectionProps {
  values: EventFormValues
  fieldErrors: Record<string, string>
  canChooseOfficial: boolean
  onOfficialChange: (value: boolean) => void
  onFieldChange: <K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) => void
  onToggleActivity: (activity: string) => void
}

export function EventBasicsSection({
  values,
  fieldErrors,
  canChooseOfficial,
  onOfficialChange,
  onFieldChange,
  onToggleActivity,
}: EventBasicsSectionProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Event Basics
        </div>
        {canChooseOfficial && (
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm">Event type</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`rounded-xl px-3 py-1 text-sm font-medium border transition-colors ${
                  values.isOfficial
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground'
                }`}
                onClick={() => onOfficialChange(true)}
              >
                Official Trip
              </button>
              <button
                type="button"
                className={`rounded-xl px-3 py-1 text-sm font-medium border transition-colors ${
                  !values.isOfficial
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground'
                }`}
                onClick={() => onOfficialChange(false)}
              >
                Community Meetup
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              placeholder="Red Rock Sunrise Hike"
            />
            {fieldErrors.title && <p className="text-xs text-red-500">{fieldErrors.title}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="shortSummary">Short summary</Label>
            <Input
              id="shortSummary"
              value={values.shortSummary ?? ''}
              onChange={(e) => onFieldChange('shortSummary', e.target.value)}
              placeholder="Quick overview for the calendar"
            />
            {fieldErrors.shortSummary && (
              <p className="text-xs text-red-500">{fieldErrors.shortSummary}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Kind</Label>
            <Select value={values.kind} onValueChange={(value) => onFieldChange('kind', value as EventFormValues['kind'])}>
              <SelectTrigger>
                <SelectValue placeholder="Select kind" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind.charAt(0).toUpperCase() + kind.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.kind && <p className="text-xs text-red-500">{fieldErrors.kind}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Difficulty</Label>
            <Select
              value={values.difficulty ?? ''}
              onValueChange={(value) => onFieldChange('difficulty', value as EventFormValues['difficulty'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_DIFFICULTIES.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Activity types</Label>
          <div className="flex flex-wrap gap-4">
            {ACTIVITY_OPTIONS.map((activity) => (
              <label key={activity} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={values.activityTypes?.includes(activity)}
                  onCheckedChange={() => onToggleActivity(activity)}
                />
                {activity}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
