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
  routes: TopoRoute[]
  selectedClimbId: string | null
  selectedOnly: boolean
  onClimbSelect: (id: string) => void
}

// Paths and label points use the unchanged base photograph's pixel coordinates.
// Route geometry is separately authored; it is never inferred from an image.
export function TopoRoutes({
  width,
  height,
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
  const labelRadius = Math.max(width / 35, 18)

  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG routes form a keyboard-accessible group; HTML fieldsets cannot contain native SVG paths.
    <svg
      className={styles.routeOverlay}
      viewBox={`0 0 ${width} ${height}`}
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>Interactive routes. Select a numbered line.</title>
      {visibleRoutes.map(({ climb, geometry, number }) => {
        const selected = climb.id === selectedClimbId
        return (
          // biome-ignore lint/a11y/useSemanticElements: An SVG group preserves authored path coordinates while exposing Enter/Space selection and matching HTML climb buttons.
          <g
            key={climb.id}
            className={styles.route}
            data-selected={selected}
            data-muted={selectedClimbId !== null && !selected}
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
            <path
              d={geometry.path}
              className={styles.routeHalo}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={geometry.path}
              className={styles.routeLine}
              strokeDasharray={
                selected ? undefined : number % 2 ? '5 5' : '12 5'
              }
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={geometry.labelPoint.x}
              cy={geometry.labelPoint.y}
              r={labelRadius}
              className={styles.routeNumberCircle}
            />
            <text
              x={geometry.labelPoint.x}
              y={geometry.labelPoint.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={labelRadius * 1.1}
              className={styles.routeNumber}
            >
              {number}
            </text>
            <path
              d={geometry.path}
              className={styles.routeHitTarget}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )
      })}
    </svg>
  )
}
