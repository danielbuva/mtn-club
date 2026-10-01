import type { Boulder, Climb } from '@/lib/kraft/types'
import styles from './topo.module.css'

const stateLabels = {
  partial: 'Partial guide record',
  'blocked-lawful-image': 'Face photograph needed',
  'blocked-identity': 'Physical identity unresolved',
  'blocked-evidence': 'Face or route evidence needed',
  excluded: 'Excluded from guide use',
  complete: 'Reviewed guide record',
} as const

export function ContentStateNote({ record }: { record: Boulder | Climb }) {
  const state = record.contentState
  if (!state) return null
  return (
    <div className={styles.gradeNote}>
      <strong>{stateLabels[state.status]}</strong>
      {state.reasons.map(reason => (
        <p key={reason}>{reason}</p>
      ))}
    </div>
  )
}
