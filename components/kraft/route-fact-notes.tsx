import type { Climb, EvidenceSource } from '@/lib/kraft/types'
import styles from './topo.module.css'

const factFields = [
  ['face', 'Face evidence'],
  ['start', 'Start'],
  ['path', 'General line'],
  ['finish', 'Finish'],
  ['constraints', 'Variants & restrictions'],
  ['approach', 'Location notes'],
] as const

export function RouteFactNotes({
  climb,
  sources,
}: {
  climb: Climb
  sources: EvidenceSource[]
}) {
  const evidence = climb.routeFacts
  if (!evidence) return null
  return (
    <section className={styles.gradeNote} aria-label="Published route evidence">
      <strong>Published route evidence</strong>
      {evidence.observations.map(observation => (
        <details key={observation.sourceId} className={styles.factObservation}>
          <summary>
            {observation.publisher}
            {observation.sourceDependency === 'correlated-mp-import' &&
              ' · linked import'}
            {observation.sourceDependency === 'origin-unresolved' &&
              ' · origin unresolved'}
          </summary>
          <p>
            {sources.find(source => source.id === observation.sourceId)?.title}{' '}
            · retrieved {observation.retrievedAt.slice(0, 10)}
          </p>
          {observation.sourceDependency === 'correlated-mp-import' && (
            <p>
              This imported record shares Mountain Project lineage; it is not
              independent corroboration.
            </p>
          )}
          <dl>
            {factFields.map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  {observation.facts[key].length
                    ? observation.facts[key].map(fact => (
                        <p key={fact}>{fact}</p>
                      ))
                    : 'Not described in this source.'}
                </dd>
              </div>
            ))}
          </dl>
          {observation.unresolved.length > 0 && (
            <p>{observation.unresolved.join(' ')}</p>
          )}
        </details>
      ))}
      {evidence.discrepancyNotes.length > 0 && (
        <p>{evidence.discrepancyNotes.join(' ')}</p>
      )}
      <p>
        Published descriptions do not establish a reviewed line on the guide
        image.
      </p>
    </section>
  )
}
