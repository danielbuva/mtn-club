'use client'

import { useRef, useState } from 'react'
import {
  type MapBounds,
  type MapPoint,
  projectLocation,
} from '@/lib/kraft/geography'
import {
  catalogClimbCount,
  clusterCatalogPoints,
  nearestCatalogCluster,
} from '@/lib/kraft/map-placement'
import { gradeRange } from '@/lib/kraft/search'
import type { Boulder } from '@/lib/kraft/types'

interface MapCatalogLayerProps {
  boulders: Boulder[]
  selectedBoulderId: string | null
  visibleIds: ReadonlySet<string>
  pixelsPerUnit: number
  bounds: MapBounds
  onSelect: (id: string) => void
  onClusterSelect: (ids: string[], trigger: SVGGElement) => void
  canSelect: () => boolean
  matchingClimbCounts?: Record<string, number>
  filtersActive: boolean
}

function inBounds(point: MapPoint, bounds: MapBounds) {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  )
}

function CatalogLabel({
  boulder,
  point,
  bounds,
  pixelsPerUnit,
  matchingCount,
}: {
  boulder: Boulder
  point: MapPoint
  bounds: MapBounds
  pixelsPerUnit: number
  matchingCount?: number
}) {
  const width = (bounds.maxX - bounds.minX) * pixelsPerUnit
  const height = (bounds.maxY - bounds.minY) * pixelsPerUnit
  const x = (point.x - bounds.minX) * pixelsPerUnit
  const y = (point.y - bounds.minY) * pixelsPerUnit
  const rightHalf = x > width / 2
  const labelY = y > height - 90 ? -24 : 29
  const label =
    matchingCount === undefined
      ? `${catalogClimbCount(boulder)} listed climbs`
      : `${matchingCount} matching climbs`
  return (
    <g
      className="kraft-map-rock-label"
      transform={`translate(${rightHalf ? -15 : 15} ${labelY})`}
      pointerEvents="none"
    >
      <text
        className="kraft-map-boulder-name"
        textAnchor={rightHalf ? 'end' : 'start'}
      >
        {boulder.name}
      </text>
      <text
        className="kraft-map-boulder-grade"
        y="16"
        textAnchor={rightHalf ? 'end' : 'start'}
      >
        {gradeRange(boulder.climbs)} · {label}
      </text>
    </g>
  )
}

/** Neutral points locate source records. Cluster counts never count physical rocks. */
export function MapCatalogLayer({
  boulders,
  selectedBoulderId,
  visibleIds,
  pixelsPerUnit,
  bounds,
  onSelect,
  onClusterSelect,
  canSelect,
  matchingClimbCounts,
  filtersActive,
}: MapCatalogLayerProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const pointTargets = useRef(new Map<string, SVGGElement>())
  const byId = new Map(boulders.map(boulder => [boulder.id, boulder]))
  const points = boulders.flatMap(boulder => {
    if (
      !boulder.location ||
      (!visibleIds.has(boulder.id) && boulder.id !== selectedBoulderId)
    )
      return []
    const point = projectLocation(boulder.location)
    return inBounds(point, bounds) ? [{ id: boulder.id, point }] : []
  })
  const clusters = clusterCatalogPoints(points, pixelsPerUnit)
  const selected = selectedBoulderId ? byId.get(selectedBoulderId) : undefined
  const selectedPoint = selected?.location
    ? projectLocation(selected.location)
    : null
  return (
    <g className="kraft-map-catalog-layer">
      {clusters.map(cluster => {
        const firstId = cluster.ids[0]
        const boulder = firstId ? byId.get(firstId) : undefined
        if (!boulder) return null
        const multiple = cluster.ids.length > 1
        const active = cluster.ids.includes(selectedBoulderId ?? '')
        const label = multiple
          ? `${cluster.ids.length} nearby catalog records. Choose a catalog.`
          : `${boulder.name}, ${gradeRange(boulder.climbs)}, ${catalogClimbCount(boulder)} listed climbs. Open catalog.`
        const open = (trigger: SVGGElement, ids = cluster.ids) => {
          if (!canSelect()) return
          if (ids.length > 1) onClusterSelect(ids, trigger)
          else if (ids[0]) onSelect(ids[0])
        }
        return (
          // biome-ignore lint/a11y/useSemanticElements: SVG groups implement button keyboard behavior for mapped source points.
          <g
            key={cluster.ids.join(':')}
            ref={element => {
              const key = cluster.ids.join(':')
              if (element) pointTargets.current.set(key, element)
              else pointTargets.current.delete(key)
            }}
            className="kraft-map-boulder"
            data-selected={active}
            data-cluster={multiple}
            data-boulder-id={multiple ? undefined : boulder.id}
            data-catalog-ids={cluster.ids.join(',')}
            transform={`translate(${cluster.point.x} ${cluster.point.y}) scale(${1 / pixelsPerUnit})`}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={active}
            onClick={event => {
              if (event.detail === 0) {
                open(event.currentTarget)
                return
              }
              const matrix = event.currentTarget.ownerSVGElement?.getScreenCTM()
              if (!matrix) return
              const point = new DOMPoint(
                event.clientX,
                event.clientY,
              ).matrixTransform(matrix.inverse())
              const nearest = nearestCatalogCluster(clusters, point)
              if (!nearest) return
              const trigger = pointTargets.current.get(nearest.ids.join(':'))
              if (trigger) open(trigger, nearest.ids)
            }}
            onFocus={() => setFocusedId(boulder.id)}
            onBlur={() => setFocusedId(null)}
            onMouseEnter={() => setHoveredId(boulder.id)}
            onMouseLeave={() => setHoveredId(null)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.stopPropagation()
                open(event.currentTarget)
              }
            }}
          >
            <title>{label}</title>
            <circle className="kraft-map-rock-target" r="22" />
            <circle className="kraft-map-rock-ring" r="21" />
            <circle className="kraft-map-catalog-point" r={multiple ? 15 : 6} />
            {multiple && (
              <text
                className="kraft-map-cluster-count"
                y="4"
                textAnchor="middle"
              >
                {cluster.ids.length}
              </text>
            )}
            {!multiple &&
              (active ||
                focusedId === boulder.id ||
                hoveredId === boulder.id) && (
                <CatalogLabel
                  boulder={boulder}
                  point={cluster.point}
                  bounds={bounds}
                  pixelsPerUnit={pixelsPerUnit}
                  matchingCount={
                    filtersActive
                      ? matchingClimbCounts?.[boulder.id]
                      : undefined
                  }
                />
              )}
          </g>
        )
      })}
      {selected &&
        selectedPoint &&
        inBounds(selectedPoint, bounds) &&
        clusters.some(
          cluster =>
            cluster.ids.length > 1 && cluster.ids.includes(selected.id),
        ) && (
          <g
            className="kraft-map-selected-point"
            transform={`translate(${selectedPoint.x} ${selectedPoint.y}) scale(${1 / pixelsPerUnit})`}
            pointerEvents="none"
          >
            <circle r="7" />
            <CatalogLabel
              boulder={selected}
              point={selectedPoint}
              bounds={bounds}
              pixelsPerUnit={pixelsPerUnit}
              matchingCount={
                filtersActive ? matchingClimbCounts?.[selected.id] : undefined
              }
            />
          </g>
        )}
    </g>
  )
}
