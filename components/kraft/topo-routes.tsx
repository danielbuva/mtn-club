'use client'

import { useId } from 'react'
import type { Climb, RouteGeometry } from '@/lib/kraft/types'
import styles from './topo.module.css'

type AuthoredGeometry = Extract<RouteGeometry, { status: 'authored' }>

export type TopoRoute = {
  climb: Climb
  geometry: AuthoredGeometry
  number: number
}

type TopoRoutesProps = {
  width: number
  height: number
  zoom?: number
  routes: TopoRoute[]
  selectedClimbId: string | null
  selectedOnly: boolean
  onClimbSelect: (id: string) => void
}

// Paths and labels use the base image's native pixel coordinates.
// Route geometry is separately authored from source facts and image correspondence.
export function TopoRoutes({
  width,
  height,
  zoom = 1,
  routes,
  selectedClimbId,
  selectedOnly,
  onClimbSelect,
}: TopoRoutesProps) {
  const titleId = useId()
  const visibleRoutes = routes
    .filter(route => !selectedOnly || route.climb.id === selectedClimbId)
    .toSorted(
      (a, b) =>
        Number(a.climb.id === selectedClimbId) -
        Number(b.climb.id === selectedClimbId),
    )
  const showMarkers = zoom < 2
  const labelRadius = Math.max(width / 55, 18) / zoom ** 1.5
  const markerOpacity = Math.max(0, 1 - (zoom - 1) * 1.4)
  const clipId = useId()
  // Every route's hit area leaves all badges clear, including shared corridors.
  const badgeHoles = (showMarkers ? visibleRoutes : [])
    .map(({ geometry }) => {
      const { x, y } = geometry.labelPoint
      const radius = labelRadius + 3
      return `M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0Z`
    })
    .join(' ')

  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG routes form a keyboard-accessible group; HTML fieldsets cannot contain native SVG paths.
    <svg
      className={styles.routeOverlay}
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Interactive routes. Select a line or climb.</title>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path
            d={`M0 0H${width}V${height}H0Z ${badgeHoles}`}
            clipRule="evenodd"
          />
        </clipPath>
      </defs>
      {visibleRoutes.map(({ climb, geometry, number }) => {
        const selected = climb.id === selectedClimbId
        return (
          // biome-ignore lint/a11y/useSemanticElements: An SVG group preserves authored path coordinates while exposing Enter/Space selection and matching HTML climb buttons.
          <g
            key={climb.id}
            className={styles.route}
            data-selected={selected}
            data-muted={selectedClimbId !== null && !selected}
            data-confidence={geometry.confidenceLevel ?? 'high'}
            role="button"
            tabIndex={0}
            aria-label={`Route ${number}: ${climb.name}, ${climb.grade}`}
            aria-pressed={selected}
            onClick={() => onClimbSelect(climb.id)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClimbSelect(climb.id)
              }
            }}
          >
            <g clipPath={`url(#${clipId})`}>
              <path
                d={geometry.path}
                className={styles.routeLine}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={geometry.path}
                className={styles.routeHitTarget}
                vectorEffect="non-scaling-stroke"
              />
            </g>
            {showMarkers && (
              <g opacity={markerOpacity}>
                <circle
                  cx={geometry.labelPoint.x}
                  cy={geometry.labelPoint.y}
                  r={labelRadius}
                  className={styles.routeNumberCircle}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={geometry.labelPoint.x}
                  y={geometry.labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={labelRadius * 1.25}
                  className={styles.routeNumber}
                >
                  {number}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
