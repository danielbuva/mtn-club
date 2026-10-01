'use client'

import { projectLocation } from '@/lib/kraft/geography'
import { gradeRange as climbGradeRange } from '@/lib/kraft/search'
import type { Boulder } from '@/lib/kraft/types'

interface MapBoulderProps {
  boulder: Boulder
  index: number
  selected: boolean
  visible: boolean
  pixelsPerUnit: number
  onSelect: (id: string) => void
  canSelect: () => boolean
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  matchingCount?: number
  locationPoint?: { x: number; y: number } | null
}

const ROCK_SYMBOLS = [
  'M-12-8 2-13 12-5 13 7 3 13-11 6Z',
  'M-13-5-4-13 8-10 14 1 7 12-9 11Z',
  'M-11-9 5-12 14-2 9 11-5 14-14 2Z',
  'M-14-3-8-11 8-12 14 2 7 10-11 9Z',
]

export function boulderGradeRange(boulder: Boulder): string {
  return climbGradeRange(boulder.climbs)
}

export function MapBoulder({
  boulder,
  index,
  selected,
  visible,
  pixelsPerUnit,
  onSelect,
  canSelect,
  bounds,
  matchingCount,
  locationPoint,
}: MapBoulderProps) {
  const point = projectLocation(boulder.location)
  const enabled = visible || selected
  if (
    point.x < bounds.minX ||
    point.x > bounds.maxX ||
    point.y < bounds.minY ||
    point.y > bounds.maxY
  )
    return null
  const canvasWidth = (bounds.maxX - bounds.minX) * pixelsPerUnit
  const canvasHeight = (bounds.maxY - bounds.minY) * pixelsPerUnit
  const compact = canvasWidth < 340
  const preferred =
    boulder.id === 'cube'
      ? { x: 0, y: 35, anchor: 'middle' as const }
      : boulder.id === 'split-boulder'
        ? { x: 27, y: -23, anchor: 'start' as const }
        : boulder.id === 'monkey-bar'
          ? { x: -29, y: compact ? -31 : -3, anchor: 'end' as const }
          : compact
            ? { x: 80, y: 29, anchor: 'end' as const }
            : { x: 27, y: -3, anchor: 'start' as const }
  const gradeRange = boulderGradeRange(boulder)
  const countLabel =
    matchingCount === undefined
      ? `${boulder.climbs.length} listed`
      : `${matchingCount} match${matchingCount === 1 ? '' : 'es'}`
  const labelWidth = Math.max(
    boulder.name.length * 8.1,
    `${gradeRange} / ${countLabel}`.length * 5.7,
  )
  const pointX = (point.x - bounds.minX) * pixelsPerUnit
  const pointY = (point.y - bounds.minY) * pixelsPerUnit
  const left =
    pointX +
    preferred.x -
    (preferred.anchor === 'end'
      ? labelWidth
      : preferred.anchor === 'middle'
        ? labelWidth / 2
        : 0)
  const dx =
    left < 12
      ? 12 - left
      : left + labelWidth > canvasWidth - 12
        ? canvasWidth - 12 - left - labelWidth
        : 0
  const y = Math.max(
    62 - pointY,
    Math.min(canvasHeight - 77 - pointY, preferred.y),
  )
  const labelX = preferred.x + dx
  const locationX = locationPoint
    ? (locationPoint.x - bounds.minX) * pixelsPerUnit
    : null
  const locationY = locationPoint
    ? (locationPoint.y - bounds.minY) * pixelsPerUnit
    : null
  const coversLocation =
    locationX !== null &&
    locationY !== null &&
    locationX >= left + dx - 15 &&
    locationX <= left + dx + labelWidth + 15 &&
    locationY >= pointY + y - 27 &&
    locationY <= pointY + y + 27
  const labelY =
    coversLocation && boulder.id === 'monkey-bar'
      ? Math.max(62 - pointY, y - 50)
      : y
  const label =
    coversLocation && boulder.id === 'split-boulder' && pointX > labelWidth + 39
      ? { x: -27, y, anchor: 'end' as const }
      : { ...preferred, x: labelX, y: labelY }

  return (
    // biome-ignore lint/a11y/useSemanticElements: Native HTML buttons cannot contain SVG geometry; this group implements the button keyboard contract.
    <g
      className="kraft-map-boulder"
      data-selected={selected}
      data-muted={!enabled}
      data-boulder-id={boulder.id}
      transform={`translate(${point.x} ${point.y}) scale(${1 / pixelsPerUnit})`}
      role="button"
      tabIndex={enabled ? 0 : -1}
      aria-label={`${boulder.name}, ${gradeRange}, ${boulder.climbs.length} documented climbs. Open boulder.`}
      aria-pressed={selected}
      aria-disabled={!enabled}
      onClick={() => {
        if (enabled && canSelect()) onSelect(boulder.id)
      }}
      onKeyDown={event => {
        if (enabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          event.stopPropagation()
          onSelect(boulder.id)
        }
      }}
    >
      <title>{`${boulder.name} · ${gradeRange}`}</title>
      <circle className="kraft-map-rock-target" r="25" />
      <circle className="kraft-map-rock-ring" r="21" />
      <path
        className="kraft-map-rock-shadow"
        d={ROCK_SYMBOLS[index % ROCK_SYMBOLS.length]}
        transform="translate(2 3)"
      />
      <path
        className="kraft-map-rock"
        d={ROCK_SYMBOLS[index % ROCK_SYMBOLS.length]}
      />
      <path className="kraft-map-rock-facet" d="M-11-7-2 2 9-7M-2 2 4 12" />
      {enabled && (
        <g
          className="kraft-map-rock-label"
          transform={`translate(${label.x} ${label.y})`}
        >
          <text className="kraft-map-boulder-name" textAnchor={label.anchor}>
            {boulder.name}
          </text>
          <text
            className="kraft-map-boulder-grade"
            y="16"
            textAnchor={label.anchor}
          >
            {gradeRange} <tspan className="kraft-map-grade-divider"> / </tspan>
            {countLabel}
          </text>
        </g>
      )}
    </g>
  )
}
