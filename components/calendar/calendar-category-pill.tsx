'use client'

import type { CalendarCategoryKey } from '@/components/calendar/calendar-categories'
import { CATEGORY_COLORS } from '@/components/calendar/calendar-categories'
import { cn } from '@/lib/utils'

interface CalendarCategoryPillProps {
  categories: CalendarCategoryKey[]
  className?: string
}

export function CalendarCategoryPill({ categories, className }: CalendarCategoryPillProps) {
  if (categories.length === 0) return null

  if (categories.length === 1) {
    const color = CATEGORY_COLORS[categories[0]]
    return <span className={cn('inline-flex h-1.5 w-8 rounded-full', color, className)} />
  }

  return (
    <span className={cn('inline-flex h-1.5 w-10 overflow-hidden rounded-full', className)}>
      {categories.map((category) => (
        <span
          key={category}
          className={cn('flex-1', CATEGORY_COLORS[category])}
        />
      ))}
    </span>
  )
}
