'use client'

import { Search, X } from 'lucide-react'
import { type GuideFilters, gradeBands } from '@/lib/kraft/search'
import type { KraftArea } from '@/lib/kraft/types'

export function GuideSearch({
  filters,
  areas,
  onChange,
}: {
  filters: GuideFilters
  areas: KraftArea[]
  onChange: (patch: Partial<GuideFilters>) => void
}) {
  return (
    <div className="kraft-search">
      <div className="kraft-search-input">
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search climbs, boulders or areas"
          placeholder="Find a climb, boulder or area"
          value={filters.query}
          onChange={event => onChange({ query: event.target.value })}
        />
        {filters.query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onChange({ query: '' })}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="kraft-filter-row">
        <label className="kraft-area-select">
          <span className="sr-only">Physical area</span>
          <select
            value={filters.areaId}
            onChange={event => onChange({ areaId: event.target.value })}
          >
            <option value="">All areas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="kraft-grade-filters">
          <legend className="sr-only">Filter by V grade</legend>
          {gradeBands.map(band => (
            <button
              key={band.id}
              type="button"
              aria-pressed={filters.grade === band.id}
              onClick={() => onChange({ grade: band.id })}
            >
              {band.label}
            </button>
          ))}
        </fieldset>
      </div>
    </div>
  )
}
