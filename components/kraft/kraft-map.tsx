'use client'

import { LocateFixed, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { useId, useRef } from 'react'
import {
  GEOGRAPHY_ATTRIBUTION,
  MAP_HEIGHT,
  MAP_WIDTH,
  projectLocation,
  worldUnitsForMeters,
} from '@/lib/kraft/geography'
import type { Boulder } from '@/lib/kraft/types'
import { MapBoulder } from './map-boulder'
import { MapLabels } from './map-labels'
import { MapTerrain } from './map-terrain'
import { useMapGestures } from './use-map-gestures'
import './map.css'

export interface KraftMapProps {
  boulders: Boulder[]
  selectedBoulderId: string | null
  visibleBoulderIds: string[]
  onBoulderSelect: (id: string) => void
  location?: {
    lat: number
    lon: number
    accuracy: number
    lastKnown?: boolean
  } | null
  matchingClimbCounts?: Record<string, number>
  filtersActive?: boolean
}

export function KraftMap({
  boulders,
  selectedBoulderId,
  visibleBoulderIds,
  onBoulderSelect,
  location,
  matchingClimbCounts,
  filtersActive = false,
}: KraftMapProps) {
  const informationRef = useRef<HTMLDetailsElement>(null)
  const id = useId().replaceAll(':', '')
  const map = useMapGestures()
  const locationPoint = location ? projectLocation(location) : null
  const locationInBounds =
    locationPoint &&
    locationPoint.x >= 0 &&
    locationPoint.x <= MAP_WIDTH &&
    locationPoint.y >= 0 &&
    locationPoint.y <= MAP_HEIGHT
  const visibleIds = new Set(visibleBoulderIds)
  const distances = [25, 50, 100, 200, 500]
  const scaleDistance =
    distances.toSorted(
      (a, b) =>
        Math.abs(worldUnitsForMeters(a) * map.pixelsPerUnit - 72) -
        Math.abs(worldUnitsForMeters(b) * map.pixelsPerUnit - 72),
    )[0] ?? 100
  const scalePixels = worldUnitsForMeters(scaleDistance) * map.pixelsPerUnit

  return (
    <div className="kraft-map-shell" data-kraft-map>
      <div className="kraft-map-stage">
        <svg
          ref={map.svgRef}
          className="kraft-map-canvas"
          viewBox={map.viewBox}
          role="application"
          aria-label="Illustrated north-up map of Kraft Boulders"
          aria-describedby={`${id}-instructions ${id}-accuracy`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: The SVG provides explicit keyboard pan and zoom behavior.
          tabIndex={0}
          {...map.handlers}
        >
          <title>Kraft Boulders field map</title>
          <desc>
            Accurate north-up open geographic data. Tap a named rock to open its
            documented climbs. Boulder shapes are symbols, not surveyed
            footprints.
          </desc>
          <MapTerrain idPrefix={id} />
          <MapLabels
            pixelsPerUnit={map.pixelsPerUnit}
            zoom={map.camera.zoom}
            bounds={map.bounds}
          />
          {location && locationPoint && locationInBounds && (
            <g
              className="kraft-map-location"
              data-last-known={location.lastKnown}
              pointerEvents="none"
              transform={`translate(${locationPoint.x} ${locationPoint.y})`}
            >
              <circle
                className="kraft-map-location-accuracy"
                r={worldUnitsForMeters(location.accuracy)}
              />
            </g>
          )}
          {boulders.map((boulder, index) => (
            <MapBoulder
              key={boulder.id}
              boulder={boulder}
              index={index}
              selected={selectedBoulderId === boulder.id}
              visible={visibleIds.has(boulder.id)}
              pixelsPerUnit={map.pixelsPerUnit}
              onSelect={onBoulderSelect}
              canSelect={map.canSelect}
              bounds={map.bounds}
              locationPoint={locationInBounds ? locationPoint : null}
              matchingCount={
                filtersActive ? matchingClimbCounts?.[boulder.id] : undefined
              }
            />
          ))}
          {location && locationPoint && locationInBounds && (
            <g
              className="kraft-map-location"
              data-last-known={location.lastKnown}
              transform={`translate(${locationPoint.x} ${locationPoint.y})`}
              pointerEvents="none"
            >
              <title>
                {location.lastKnown
                  ? 'Last known position. Refresh your location to update it.'
                  : 'Latest GPS fix.'}
              </title>
              <circle
                className="kraft-map-location-ring"
                vectorEffect="non-scaling-stroke"
                r={10 / map.pixelsPerUnit}
              />
              <circle
                className="kraft-map-location-dot"
                r={5 / map.pixelsPerUnit}
              />
            </g>
          )}
        </svg>
        <div className="kraft-map-edition" aria-hidden="true">
          <span>MTN / FIELD NOTES</span>
          <span>01 — KRAFT</span>
        </div>
        <div className="kraft-map-north" role="img" aria-label="North is up">
          <span>N</span>
          <svg viewBox="0 0 24 36" aria-hidden="true">
            <path d="M12 1 22 30 12 24 2 30Z" />
            <path d="M12 1V24L2 30Z" />
          </svg>
        </div>
        <div
          className="kraft-map-controls"
          role="toolbar"
          aria-label="Map controls"
        >
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in (+)"
            disabled={map.atMaxZoom}
            onClick={map.zoomIn}
          >
            <Plus size={19} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out (−)"
            disabled={map.atMinZoom}
            onClick={map.zoomOut}
          >
            <Minus size={19} />
          </button>
          <button
            type="button"
            aria-label="Reset map view"
            title="Return to the pilot overview"
            onClick={map.reset}
          >
            <RotateCcw size={17} />
          </button>
        </div>
        <div
          className="kraft-map-scale"
          role="img"
          aria-label={`Scale: ${scaleDistance} metres`}
        >
          <span style={{ width: `${scalePixels}px` }} />
          <small>{scaleDistance} m</small>
        </div>
        <div className="kraft-map-hint">
          <LocateFixed size={13} aria-hidden="true" />
          <span>Tap a rock. Find your next climb.</span>
        </div>
        {!visibleBoulderIds.length && (
          <p className="kraft-map-empty">
            No rocks match these filters.
            <br />
            Adjust your search to explore Kraft.
          </p>
        )}
      </div>
      <div className="kraft-map-caption">
        <ul className="kraft-map-key" aria-label="Map legend">
          <li>
            <i className="kraft-map-key-rock" />
            Documented boulder
          </li>
          <li>
            <i className="kraft-map-key-trail" />
            Mapped trail
          </li>
          <li>
            <i className="kraft-map-key-wash" />
            Dry wash
          </li>
        </ul>
        <details
          ref={informationRef}
          className="kraft-map-data-note"
          onKeyDown={event => {
            if (event.key === 'Escape' && informationRef.current) {
              informationRef.current.open = false
              informationRef.current.querySelector('summary')?.focus()
              event.stopPropagation()
            }
          }}
        >
          <summary>About this map</summary>
          <button
            type="button"
            className="kraft-map-note-close"
            aria-label="Close map information"
            onClick={() => {
              if (informationRef.current) {
                informationRef.current.open = false
                informationRef.current.querySelector('summary')?.focus()
              }
            }}
          >
            <X size={17} aria-hidden="true" />
          </button>
          <p id={`${id}-accuracy`}>
            Rock symbols show published GPS observations. Their shapes do not
            represent surveyed footprints. Trails and intermittent washes follow
            open map data; confirm conditions on the ground.
          </p>
          <p>
            {GEOGRAPHY_ATTRIBUTION} Terrain illustration interpreted from
            public-domain USGS/USDA NAIP orthoimagery.
          </p>
        </details>
      </div>
      <p id={`${id}-instructions`} className="sr-only">
        Drag to pan. Pinch or use the mouse wheel to zoom. With the map focused,
        use arrow keys to pan, plus and minus to zoom, or Home to reset. Tab to
        a named boulder and press Enter or Space to open it. A searchable
        boulder list is also available below the map.
      </p>
    </div>
  )
}
