import type { Face } from '@/lib/kraft/types'
import styles from './topo.module.css'

function faceLabel(face: Face): string {
  return /^[NSWE]{1,2}$/.test(face.orientation)
    ? face.orientation
    : face.name.replace(/ face$/i, '')
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
  if (!faces.length) return null
  return (
    <div className={styles.faceToolbar}>
      <fieldset className={styles.faceTabs} aria-label="Recorded boulder faces">
        {faces.map(item => (
          <button
            key={item.id}
            type="button"
            aria-label={`${item.name} · ${item.orientation}`}
            aria-pressed={face?.id === item.id}
            title={item.name}
            onClick={() => onFaceSelect(item.id)}
          >
            {faceLabel(item)}
          </button>
        ))}
      </fieldset>
      <span className={styles.faceStatus}>
        {face?.groupingStatus === 'editorial-provisional'
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
