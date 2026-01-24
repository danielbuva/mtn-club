'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEMESTER_OPTIONS, type SemesterKey } from '@/components/calendar/calendar-utils'

interface CalendarSemesterSelectProps {
  value: SemesterKey
  onChange: (value: SemesterKey) => void
}

export function CalendarSemesterSelect({ value, onChange }: CalendarSemesterSelectProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as SemesterKey)}>
      <SelectTrigger className="w-44 rounded-full">
        <SelectValue placeholder="Semester" />
      </SelectTrigger>
      <SelectContent>
        {SEMESTER_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
