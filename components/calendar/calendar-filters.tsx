'use client'

import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { type Filters, FiltersPanel } from '@/components/filters-panel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CalendarFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  collapsed: boolean
  onCollapsedChange: (value: boolean) => void
  className?: string
}

export function CalendarFilters({
  filters,
  onFiltersChange,
  collapsed,
  onCollapsedChange,
  className,
}: CalendarFiltersProps) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card p-4', className)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Filters</h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!collapsed && (
        <div className="mt-4">
          <FiltersPanel filters={filters} onFiltersChange={onFiltersChange} />
        </div>
      )}
    </div>
  )
}
