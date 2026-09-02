import { Eye, Minus, Plus, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EVENT_VISIBILITIES } from '@/lib/events/constants'
import type { EventFormValues } from '@/lib/events/schema'

interface EventSettingsSectionProps {
  values: EventFormValues
  fieldErrors: Record<string, string>
  isNoLimitEnabled: boolean
  canChooseLeaderVisibility: boolean
  onNoLimitChange: (enabled: boolean) => void
  onFieldChange: <K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K],
  ) => void
}

export function EventSettingsSection({
  values,
  fieldErrors,
  isNoLimitEnabled,
  canChooseLeaderVisibility,
  onNoLimitChange,
  onFieldChange,
}: EventSettingsSectionProps) {
  const initialLimit = Number.parseInt(values.maxParticipants ?? '', 10)
  const [lastSetLimit, setLastSetLimit] = useState<number>(
    Number.isFinite(initialLimit) && initialLimit > 0 ? initialLimit : 1,
  )

  const visibilityOptions = EVENT_VISIBILITIES.filter(visibility => {
    if (visibility === 'leaders_only' && !canChooseLeaderVisibility) {
      return false
    }
    return true
  })

  const parsedMaxParticipants = Number.parseInt(
    values.maxParticipants ?? '',
    10,
  )
  const hasNumberValue =
    Number.isFinite(parsedMaxParticipants) && parsedMaxParticipants > 0
  const currentLimit = hasNumberValue ? parsedMaxParticipants : null

  const setLimit = (next: number | null) => {
    if (next && next > 0) {
      setLastSetLimit(next)
    }
    onFieldChange('maxParticipants', next && next > 0 ? String(next) : '')
  }

  const decrementLimit = () => {
    onNoLimitChange(false)
    if (currentLimit === null) {
      setLimit(Math.max(1, lastSetLimit - 1))
      return
    }
    setLimit(Math.max(1, currentLimit - 1))
  }

  const incrementLimit = () => {
    onNoLimitChange(false)
    if (currentLimit === null) {
      setLimit(lastSetLimit + 1)
      return
    }
    setLimit(currentLimit + 1)
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2 md:justify-start md:gap-3">
        <div className="grid shrink-0 gap-2">
          <Label className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            Visibility
          </Label>
          <Select
            value={values.visibility}
            onValueChange={value =>
              onFieldChange(
                'visibility',
                value as EventFormValues['visibility'],
              )
            }
          >
            <SelectTrigger className="w-[124px] pl-3 pr-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map(visibility => (
                <SelectItem key={visibility} value={visibility}>
                  {visibility.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label
            htmlFor="maxParticipants"
            className="inline-flex items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            Max participants
          </Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={isNoLimitEnabled ? 'default' : 'outline'}
              className="h-9 w-[88px] border border-transparent px-0 text-sm whitespace-nowrap"
              onClick={() => {
                onNoLimitChange(!isNoLimitEnabled)
              }}
            >
              No limit
            </Button>
            <div className="flex h-10 items-center rounded-md border border-input bg-background">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none rounded-l-md"
                onClick={decrementLimit}
                aria-label="Decrease max participants"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="maxParticipants"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={currentLimit ?? ''}
                onChange={e => {
                  onNoLimitChange(false)
                  const next = Number.parseInt(e.target.value, 10)
                  if (!Number.isFinite(next) || next <= 0) {
                    setLimit(null)
                    return
                  }
                  setLimit(next)
                }}
                placeholder="1"
                className="h-9 w-10 rounded-none border-0 px-1 text-center text-sm [appearance:textfield] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none rounded-r-md"
                onClick={incrementLimit}
                aria-label="Increase max participants"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {fieldErrors.maxParticipants && (
            <p className="text-xs text-red-500">
              {fieldErrors.maxParticipants}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
