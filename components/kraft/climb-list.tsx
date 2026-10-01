import { ArrowRight } from 'lucide-react'
import type { Boulder, Climb } from '@/lib/kraft/types'
import { gradeRecordNote } from './source-notes'
import styles from './topo.module.css'

export function ClimbList({
  climbs,
  boulder,
  selectedClimbId,
  onClimbSelect,
}: {
  climbs: Climb[]
  boulder: Boulder
  selectedClimbId: string | null
  onClimbSelect: (id: string) => void
}) {
  return (
    <ol className={styles.climbList}>
      {climbs.map(climb => (
        <li key={climb.id} data-climb-id={climb.id}>
          <button
            type="button"
            aria-pressed={climb.id === selectedClimbId}
            onClick={() => onClimbSelect(climb.id)}
          >
            <span className={styles.listNumber}>
              {String(boulder.climbs.indexOf(climb) + 1).padStart(2, '0')}
            </span>
            <span className={styles.listName}>
              {climb.name}
              <small>
                {climb.faceIds.length > 0
                  ? boulder.faces
                      .filter(face => climb.faceIds.includes(face.id))
                      .map(face =>
                        face.orientation === 'Unconfirmed'
                          ? face.name
                          : face.orientation,
                      )
                      .join(' / ')
                  : 'Face assignment pending'}
              </small>
              {gradeRecordNote(climb) && (
                <small>{gradeRecordNote(climb)}</small>
              )}
            </span>
            <b className={styles.listGrade}>{climb.grade}</b>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ol>
  )
}
