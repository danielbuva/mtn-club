import { ExternalLink } from 'lucide-react'
import type {
  Boulder,
  Climb,
  EvidenceSource,
  SourceAlias,
} from '@/lib/kraft/types'
import styles from './topo.module.css'

type SourceNotesProps = {
  sourceIds: string[]
  sources: EvidenceSource[]
  label?: string
  boulder?: Boulder
  aliases?: SourceAlias[]
}

export function SourceNotes({
  sourceIds,
  sources,
  label = 'Sources & field status',
  boulder,
  aliases,
}: SourceNotesProps) {
  const records = sources.filter(source => sourceIds.includes(source.id))

  if (records.length === 0) return null

  return (
    <details className={styles.sources}>
      <summary>{label}</summary>
      <div className={styles.sourceBody}>
        <p>
          Source records show where this information came from. The field status
          of the boulder and climbs is listed separately.
        </p>
        {boulder?.areaAssignmentStatus === 'editorial-provisional' && (
          <p>Area grouping is an editorial choice and awaits field review.</p>
        )}
        {boulder?.location?.observations && (
          <div className={styles.locationNotes}>
            <strong>Coordinate observations</strong>
            <ul>
              {boulder.location.observations.map(observation => (
                <li key={`${observation.sourceId}-${observation.selection}`}>
                  <b>
                    {observation.selection === 'selected'
                      ? 'Used on the map'
                      : observation.selection === 'rejected'
                        ? 'Not used on the map'
                        : 'Comparison record'}
                  </b>
                  <span>
                    {observation.lat.toFixed(6)}, {observation.lon.toFixed(6)} ·{' '}
                    {sources.find(source => source.id === observation.sourceId)
                      ?.publisher ?? observation.sourceId}
                  </span>
                  <p>{observation.selectionReason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(aliases ?? boulder?.aliasObservations ?? []).map(alias => (
          <p key={`${alias.sourceId}-${alias.name}`}>
            <b>{alias.name}</b> ·{' '}
            {sources.find(source => source.id === alias.sourceId)?.publisher ??
              alias.sourceId}
            {alias.identityStatus === 'unresolved'
              ? ' · Identity unconfirmed'
              : ' · Source-linked alias'}
            {alias.note && ` — ${alias.note}`}
          </p>
        ))}
        <ul>
          {records.map(source => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
              <span>
                {source.publisher} · Accessed {source.accessedAt}
              </span>
              {source.note && <p>{source.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

export function gradeRecordNote(climb: Climb) {
  if (
    climb.gradeObservations.some(item => item.identityStatus === 'unresolved')
  ) {
    return 'Same-name record; route identity unconfirmed'
  }
  return climb.disagreement ? 'Grade records differ' : undefined
}
