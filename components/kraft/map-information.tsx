'use client'

import { X } from 'lucide-react'
import { useRef } from 'react'
import { GEOGRAPHY_ATTRIBUTION } from '@/lib/kraft/geography'
import { surfaceCandidates } from '@/lib/kraft/surface-candidates'

export function MapInformation({
  accuracyId,
  mapHeight,
}: {
  accuracyId: string
  mapHeight: number
}) {
  const informationRef = useRef<HTMLDetailsElement>(null)
  const bodyHeight = Math.max(100, Math.min(320, mapHeight - 90))
  function close() {
    const information = informationRef.current
    if (!information) return
    information.open = false
    information.querySelector('summary')?.focus()
  }
  return (
    <details
      ref={informationRef}
      className="kraft-map-data-note"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          close()
          event.stopPropagation()
        }
      }}
    >
      <summary>About this map</summary>
      <button
        type="button"
        className="kraft-map-note-close"
        aria-label="Close map information"
        onClick={close}
      >
        <X size={17} aria-hidden="true" />
      </button>
      <section
        className="kraft-map-note-scroll"
        style={{ maxHeight: bodyHeight }}
        aria-label="Map sources and uncertainty"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: The bounded disclosure region must support keyboard scrolling.
        tabIndex={0}
      >
        <p id={accuracyId}>
          Points show published source locations with unknown accuracy. Numbered
          clusters count catalog records, including unresolved or multi-rock
          groups. Source area centroids are not physical boulder positions. No
          boulder footprints or final approaches are surveyed. Trails and
          intermittent washes follow open map data; confirm conditions on the
          ground.
        </p>
        <p>
          {GEOGRAPHY_ATTRIBUTION} Source comparisons use public-domain USGS/USDA
          NAIP orthoimagery from June 2022. Light and shadow boundaries do not
          establish a named rock's footprint.
        </p>
        <p>
          {surfaceCandidates.length} dashed aerial candidates show partial
          visible surfaces with low spatial confidence. Outlines are incomplete;
          named rock associations are unresolved. Shaded faces and cast shadows
          are omitted. Catalog points keep their published positions
          independently of these candidates.
        </p>
      </section>
    </details>
  )
}
