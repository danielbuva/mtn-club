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
        <h3>No matching records in this pilot.</h3>
        <p>
          Try another name or widen the grade range. This edition covers part of
          Kraft; more climbs remain to be documented.
        </p>
        <button type="button" onClick={onReset}>
          Reset filters
        </button>
      </div>
    )
  return (
    <ul className="kraft-results" aria-label="Matching boulders and climbs">
      {results.map(({ boulder, climbs }, index) => (
        <li key={boulder.id}>
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
              </span>
              <span className="kraft-result-name">{boulder.name}</span>
              <span className="kraft-result-meta">
                {climbs.length} included climbs · {gradeRange(climbs)}
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
                <li key={climb.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(boulder.id, climb.id)}
                  >
                    <span>{climb.name}</span>
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
