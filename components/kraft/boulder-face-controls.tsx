'use client'

import { useEffect, useRef } from 'react'
import type { Face } from '@/lib/kraft/types'
import styles from './topo.module.css'

const compassLabels: Record<string, string> = {
  n: 'N',
  north: 'N',
  ne: 'NE',
  northeast: 'NE',
  e: 'E',
  east: 'E',
  se: 'SE',
  southeast: 'SE',
  s: 'S',
  south: 'S',
  sw: 'SW',
  southwest: 'SW',
  w: 'W',
  west: 'W',
  nw: 'NW',
  northwest: 'NW',
}

function compassLabel(face: Face): string | null {
  return (
    compassLabels[face.orientation.toLowerCase().replace(/[\s-]/g, '')] ?? null
  )
}

function shortFeatureName(name: string): string {
  const features = [
    { pattern: /relative/i, label: 'Relative' },
    { pattern: /cave/i, label: 'Cave' },
    { pattern: /crack/i, label: 'Crack' },
    { pattern: /groove/i, label: 'Groove' },
    { pattern: /corner/i, label: 'Corner' },
    { pattern: /slab/i, label: 'Slab' },
    { pattern: /ar[êe]te/i, label: 'Arête' },
    { pattern: /front/i, label: 'Front' },
    { pattern: /rear|back/i, label: 'Rear' },
    { pattern: /edge/i, label: 'Edge' },
    { pattern: /roof/i, label: 'Roof' },
  ]
  const feature = features.find(item => item.pattern.test(name))
  return (
    feature?.label ??
    name
      .replace(/\b(source|view|face|region)\b/gi, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ')
  )
}

function faceLabel(face: Face, faces: Face[]): string {
  const direction = compassLabel(face)
  if (!direction) return shortFeatureName(face.name)
  const sharedDirection = faces.some(
    item => item.id !== face.id && compassLabel(item) === direction,
  )
  return sharedDirection && !/source face$/i.test(face.name)
    ? `${direction} · ${shortFeatureName(face.name)}`
    : direction
}

export function BoulderFaceControls({
  faces,
  face,
  onFaceSelect,
}: {
  faces: Face[]
  face: Face | null
  onFaceSelect: (id: string) => void
}) {
  const tabs = useRef<HTMLFieldSetElement>(null)
  const selectedFaceId = face?.id

  useEffect(() => {
    const strip = tabs.current
    const selected = Array.from(strip?.querySelectorAll('button') ?? []).find(
      button => button.dataset.faceId === selectedFaceId,
    )
    if (!strip || !selected) return
    const left =
      selected.getBoundingClientRect().left -
      strip.getBoundingClientRect().left -
      strip.clientLeft
    const right = left + selected.offsetWidth
    if (left < 0) strip.scrollLeft += left
    else if (right > strip.clientWidth)
      strip.scrollLeft += right - strip.clientWidth
  }, [selectedFaceId])

  if (!faces.length) return null
  return (
    <div className={styles.faceToolbar}>
      <fieldset
        ref={tabs}
        className={styles.faceTabs}
        aria-label="Recorded boulder faces"
      >
        {faces.map(item => (
          <button
            key={item.id}
            type="button"
            data-face-id={item.id}
            aria-label={`${item.name} · ${item.orientation}`}
            aria-pressed={face?.id === item.id}
            title={`${item.name} · ${item.orientation}`}
            onClick={() => onFaceSelect(item.id)}
          >
            {faceLabel(item, faces)}
          </button>
        ))}
      </fieldset>
      <span className={styles.faceStatus}>
        {face?.sourceViewObservations?.length
          ? face.groupingStatus === 'editorial-provisional'
            ? 'Provisional view'
            : 'Source view'
          : face?.groupingStatus === 'editorial-provisional'
            ? 'Face grouping unconfirmed'
            : face?.orientationStatus === 'unknown'
              ? 'Orientation unconfirmed'
              : face?.orientationStatus === 'field-verified'
                ? 'Field checked'
                : 'Published orientation'}
      </span>
    </div>
  )
}
