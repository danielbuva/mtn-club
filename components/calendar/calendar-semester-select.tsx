'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SEMESTER_OPTIONS, type SemesterKey } from '@/components/calendar/calendar-utils'

interface CalendarSemesterSelectProps {
  value: SemesterKey
  onChange: (value: SemesterKey) => void
  triggerClassName?: string
  contentClassName?: string
}

export function CalendarSemesterSelect({
  value,
  onChange,
  triggerClassName,
  contentClassName,
}: CalendarSemesterSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as SemesterKey)}>
      <SelectTrigger
        className={cn('w-auto rounded-full', triggerClassName)}
        size="sm"
      >
        <SelectValue placeholder="Semester" />
      </SelectTrigger>
      <SelectContent
        align="start"
        side="bottom"
        position="popper"
        className={cn('min-w-[var(--radix-select-trigger-width)]', contentClassName)}
      >
        {SEMESTER_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
