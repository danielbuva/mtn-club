import type { Climb } from '@/lib/kraft/types'
import styles from './topo.module.css'

const dimensions = [
  ['identity', 'Identity'],
  ['grade', 'Grade'],
  ['parent', 'Parent'],
  ['face', 'Face'],
  ['topo', 'Topo'],
  ['image', 'Image'],
] as const

const evidenceLabels = {
  high: 'High confidence · corroborated path',
  moderate: 'Moderate confidence · corridor evidence',
  'face-only': 'Face only · topo detail unavailable',
  unresolved: 'Path unresolved · no route line',
} as const

export function RouteContentState({ climb }: { climb: Climb }) {
  const state = climb.contentDimensions
  if (!state) return null
  return (
    <section className={styles.gradeNote} aria-label="Route content state">
      <strong>Content state</strong>
      <dl className={styles.contentDimensions}>
        {dimensions.map(([key, label]) => (
          <div key={key} data-dimension={key} data-state={state[key]}>
            <dt>{label}</dt>
            <dd>{state[key]}</dd>
          </div>
        ))}
      </dl>
      <p>
        Verified means the published source record, grade or catalog membership
        has been checked. Physical membership and field review are recorded
        separately.
      </p>
      {climb.topoEvidence && (
        <details className={styles.factObservation}>
          <summary>
            {evidenceLabels[climb.topoEvidence.confidenceLevel]}
          </summary>
          {climb.topoEvidence.reasons.map(reason => (
            <p key={reason}>{reason}</p>
          ))}
          {state.topo === 'unavailable' && (
            <p>Topo detail unavailable. This climb remains in the guide.</p>
          )}
        </details>
      )}
    </section>
  )
}
