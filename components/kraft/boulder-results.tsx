'use client'

import { ArrowUpRight } from 'lucide-react'
import { type BoulderResult, gradeRange } from '@/lib/kraft/search'
import type { KraftArea } from '@/lib/kraft/types'
import { MatchingClimbs } from './matching-climbs'

export function BoulderResults({
  results,
  areas,
  query,
  filtersActive,
  onSelect,
  onReset,
}: {
  results: BoulderResult[]
  areas: KraftArea[]
  query: string
  filtersActive: boolean
  onSelect: (boulderId: string, climbId?: string) => void
  onReset: () => void
}) {
  if (!results.length)
    return (
      <div className="kraft-empty">
        <h3>No matching records in this edition.</h3>
        <p>
          Try another name or widen the grade range. Unresolved identities and
          missing images remain marked in the catalog.
        </p>
        <button type="button" onClick={onReset}>
          Reset filters
        </button>
      </div>
    )
  return (
    <ul className="kraft-results" aria-label="Matching boulders and climbs">
      {results.map(({ boulder, climbs, referenceClimbs = [] }, index) => (
        <li key={boulder.id} data-boulder-id={boulder.id}>
          <button
            type="button"
            className="kraft-boulder-result"
            onClick={() => onSelect(boulder.id)}
          >
            <span className="kraft-rock-index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="kraft-result-main">
              <span className="kraft-result-area">
                {areas.find(area => area.id === boulder.areaId)?.name}
                {boulder.unitKind !== 'physical-boulder' && ' · Source catalog'}
              </span>
              <span className="kraft-result-name">{boulder.name}</span>
              <span className="kraft-result-meta">
                {climbs.length} climb records
                {referenceClimbs.length > 0 &&
                  ` · ${referenceClimbs.length} linked elsewhere`}
                {' · '}
                {gradeRange([
                  ...climbs,
                  ...referenceClimbs.map(item => item.climb),
                ])}
              </span>
            </span>
            <ArrowUpRight size={22} aria-hidden="true" />
          </button>
          {(query.trim() || filtersActive) && (
            <MatchingClimbs
              boulder={boulder}
              climbs={climbs}
              references={referenceClimbs}
              compact={!query.trim()}
              onSelect={onSelect}
            />
          )}
        </li>
      ))}
    </ul>
  )
}
