import { MapPin } from 'lucide-react'
import { gradeRange } from '@/lib/kraft/search'
import type { Boulder } from '@/lib/kraft/types'
import styles from './topo.module.css'

export function BoulderInformation({ boulder }: { boulder: Boulder }) {
  return (
    <div className={styles.boulderInformation}>
      <details className={styles.approach}>
        <summary>
          <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
          Finding the boulder
        </summary>
        <p>{boulder.approach}</p>
        {boulder.location.note && <small>{boulder.location.note}</small>}
      </details>
      <details className={styles.boulderNotes}>
        <summary>About this boulder</summary>
        <p>{boulder.description}</p>
        <p>
          {boulder.coverage
            ? `${boulder.climbs.length} of ${boulder.coverage.sourceClimbCount} source-listed climbs included`
            : `${boulder.climbs.length} included climb records`}
          {' · '}
          {gradeRange(boulder.climbs)}
        </p>
        {boulder.aliases.length > 0 && (
          <p className={styles.aliases}>
            {boulder.aliases.map((alias, index) => (
              <span key={alias}>
                {index > 0 && ' · '}
                {boulder.aliasObservations?.some(
                  observation =>
                    observation.name === alias &&
                    observation.identityStatus === 'unresolved',
                )
                  ? 'Name record awaiting identity review: '
                  : 'Also recorded as '}
                {alias}
              </span>
            ))}
          </p>
        )}
      </details>
    </div>
  )
}
