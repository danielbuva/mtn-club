'use client'

import type { CalendarCategoryKey } from '@/components/calendar/calendar-categories'
import { CATEGORY_COLORS } from '@/components/calendar/calendar-categories'
import { cn } from '@/lib/utils'

interface CalendarCategoryPillProps {
  categories: CalendarCategoryKey[]
  className?: string
  eventMarker?: boolean
}

const EVENT_MARKER_SEGMENT_SIZE_PX = 8

export function CalendarCategoryPill({
  categories,
  className,
  eventMarker = false,
}: CalendarCategoryPillProps) {
  if (categories.length === 0) return null

  if (eventMarker) {
    const categoryOccurrences = new Map<CalendarCategoryKey, number>()
    const eventSegments = categories.map(category => {
      const occurrence = (categoryOccurrences.get(category) ?? 0) + 1
      categoryOccurrences.set(category, occurrence)
      return { category, key: `${category}-${occurrence}` }
    })

    return (
      <span
        data-calendar-event-marker
        aria-hidden="true"
        className={cn(
          'flex h-[8px] flex-none items-stretch overflow-hidden leading-none',
          className,
        )}
        style={{
          width: `${eventSegments.length * EVENT_MARKER_SEGMENT_SIZE_PX}px`,
        }}
      >
        {eventSegments.map(segment => (
          <span
            key={segment.key}
            className={cn(
              'block h-[8px] w-[8px] flex-none',
              CATEGORY_COLORS[segment.category],
            )}
          />
        ))}
      </span>
    )
  }

  if (categories.length === 1) {
    const color = CATEGORY_COLORS[categories[0]]
    return <span className={cn('inline-flex h-1.5 w-8', color, className)} />
  }

  return (
    <span className={cn('inline-flex h-1.5 w-10 overflow-hidden', className)}>
      {categories.map(category => (
        <span
          key={category}
          className={cn('flex-1', CATEGORY_COLORS[category])}
        />
      ))}
    </span>
  )
}
