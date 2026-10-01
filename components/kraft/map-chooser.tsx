'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { catalogClimbCount } from '@/lib/kraft/map-placement'
import type { Boulder } from '@/lib/kraft/types'

export function MapChooser({
  boulders,
  onClose,
  onSelect,
}: {
  boulders: Boulder[]
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const elementRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    elementRef.current
      ?.querySelector<HTMLButtonElement>('button[data-catalog-choice]')
      ?.focus()
  }, [])
  return (
    <div
      ref={elementRef}
      className="kraft-map-chooser"
      role="dialog"
      aria-label="Choose a nearby catalog"
      onKeyDown={event => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <div className="kraft-map-chooser-heading">
        <p>{boulders.length} nearby catalogs</p>
        <button
          type="button"
          aria-label="Close nearby catalogs"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <p>
        Source records may describe one rock, several rocks, or an unresolved
        group.
      </p>
      <ul>
        {boulders.map(boulder => (
          <li key={boulder.id}>
            <button
              type="button"
              data-catalog-choice
              data-boulder-id={boulder.id}
              onClick={() => onSelect(boulder.id)}
            >
              <span>{boulder.name}</span>
              <small>
                {catalogClimbCount(boulder)} listed climbs ·{' '}
                {boulder.id.startsWith('ob-area-')
                  ? 'OpenBeta'
                  : 'Mountain Project'}{' '}
                ·{' '}
                {boulder.location?.scope === 'catalog-centroid'
                  ? 'area centroid'
                  : 'published location'}
              </small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
