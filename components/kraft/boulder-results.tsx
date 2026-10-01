'use client'

import { ArrowUpRight } from 'lucide-react'
import { type BoulderResult, gradeRange } from '@/lib/kraft/search'
import type { KraftArea } from '@/lib/kraft/types'

export function BoulderResults({
  results,
  areas,
  query,
  onSelect,
  onReset,
}: {
  results: BoulderResult[]
  areas: KraftArea[]
  query: string
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
          {query.trim() && (
            <ul
              className="kraft-climb-results"
              aria-label={`${boulder.name} climb results`}
            >
              {climbs.map(climb => (
                <li key={climb.id} data-climb-id={climb.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(boulder.id, climb.id)}
                  >
                    <span>{climb.name}</span>
                    <strong>{climb.grade}</strong>
                  </button>
                </li>
              ))}
              {referenceClimbs.map(({ boulder: parent, climb }) => (
                <li key={climb.id} data-climb-id={climb.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(parent.id, climb.id)}
                  >
                    <span>
                      {climb.name}
                      <small>
                        Current record in {parent.name} · source parent differs
                      </small>
                    </span>
                    <strong>{climb.grade}</strong>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}
