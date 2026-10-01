import { ArrowUpRight, CornerUpRight } from 'lucide-react'
import type { Ref } from 'react'
import type { Climb, EvidenceSource, Face } from '@/lib/kraft/types'
import { ContentStateNote } from './content-state-note'
import { RouteFactNotes } from './route-fact-notes'
import { SourceNotes } from './source-notes'
import styles from './topo.module.css'

type ClimbDetailProps = {
  climb: Climb
  number: number
  face: Face | null
  faces: Face[]
  sources: EvidenceSource[]
  onFaceSelect: (id: string) => void
  articleRef?: Ref<HTMLElement>
}

export function ClimbDetail({
  climb,
  number,
  face,
  faces,
  sources,
  onFaceSelect,
  articleRef,
}: ClimbDetailProps) {
  const geometry = climb.geometry.find(route => route.faceId === face?.id)
  const continuation =
    geometry?.status === 'authored' ? geometry.continuation : undefined
  const continuedFace = faces.find(item => item.id === continuation?.faceId)
  const otherFaces = faces.filter(
    item => item.id !== face?.id && climb.faceIds.includes(item.id),
  )
  const identityUnconfirmed = climb.gradeObservations.some(
    observation => observation.identityStatus === 'unresolved',
  )

  return (
    <article
      className={styles.climbDetail}
      ref={articleRef}
      tabIndex={-1}
      aria-label={`${climb.name} details`}
    >
      <div className={styles.climbHeading}>
        <span className={styles.climbNumber}>
          {String(number).padStart(2, '0')}
        </span>
        <div>
          <span className={styles.eyebrow}>Climb record</span>
          <h3>{climb.name}</h3>
        </div>
        <span className={styles.detailGrade}>{climb.grade}</span>
      </div>
      <p className={styles.climbDescription}>{climb.description}</p>
      <RouteFactNotes climb={climb} sources={sources} />
      <ContentStateNote record={climb} />
      {climb.boulderAssignmentStatus === 'editorial-provisional' && (
        <div className={styles.gradeNote}>
          <strong>Physical boulder identity pending</strong>
          <p>{climb.boulderAssignmentNote}</p>
        </div>
      )}
      {climb.gradeObservations.length > 0 && (
        <div className={styles.gradeNote}>
          <strong>
            {identityUnconfirmed
              ? 'Same-name record; route identity unconfirmed'
              : climb.disagreement
                ? 'Grades differ between sources'
                : 'Published grades'}
          </strong>
          {climb.disagreement && <p>{climb.disagreement}</p>}
          <ul>
            {climb.gradeObservations.map(observation => (
              <li key={`${observation.sourceId}-${observation.grade}`}>
                <b>
                  {observation.system} · {observation.grade}
                </b>
                <span>
                  {sources.find(source => source.id === observation.sourceId)
                    ?.publisher ?? 'Published source'}
                  {observation.sourceName && ` · ${observation.sourceName}`}
                  {observation.identityStatus === 'unresolved' &&
                    ' · Identity unconfirmed'}
                  {observation.note && <small>{observation.note}</small>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {climb.risk && (
        <div className={styles.gradeNote}>
          <strong>Landing & exposure</strong>
          <p>{climb.risk}</p>
        </div>
      )}
      {climb.conditionObservations?.map(observation => (
        <div
          key={`${observation.sourceId}-${observation.sourceName}`}
          className={styles.gradeNote}
        >
          <strong>
            Published condition report
            {observation.identityStatus === 'unresolved' &&
              ' · identity unconfirmed'}
          </strong>
          <p>{observation.condition}</p>
          <p>
            {sources.find(source => source.id === observation.sourceId)
              ?.publisher ?? 'Published source'}{' '}
            · {observation.sourceName}. {observation.note}
          </p>
        </div>
      ))}
      {continuation && continuedFace ? (
        <button
          type="button"
          className={styles.continuation}
          onClick={() => onFaceSelect(continuedFace.id)}
        >
          <CornerUpRight size={20} aria-hidden="true" />
          <span>
            <b>Continues onto {continuedFace.name}</b>
            <span>{continuation.description}</span>
          </span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </button>
      ) : otherFaces.length > 0 ? (
        <div className={styles.otherFaces}>
          <p>This climb is also recorded on:</p>
          {otherFaces.map(item => (
            <button
              key={item.id}
              type="button"
              className={styles.textButton}
              onClick={() => onFaceSelect(item.id)}
            >
              {item.name} · {item.orientation}
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ))}
          <small>The route connection still needs a checked topo.</small>
        </div>
      ) : null}
      {climb.faceIds.length === 0 ? (
        <p className={styles.topoUnavailable}>
          The physical face for this climb has not been confirmed. Use the
          source record for research; this guide cannot identify its line yet.
        </p>
      ) : geometry?.status !== 'authored' ? (
        <p className={styles.topoUnavailable}>
          {geometry?.status === 'missing'
            ? face?.image.status === 'available'
              ? 'Route lines for this photograph await local authoring and review.'
              : geometry.reason
            : 'No reviewed route geometry is available for this face.'}
        </p>
      ) : null}
      {climb.faceAssignmentStatus === 'editorial-provisional' && (
        <p className={styles.fieldStatus}>Face grouping awaits review.</p>
      )}
      <p className={styles.fieldStatus}>
        {climb.status === 'field-verified'
          ? 'Checked at the boulder'
          : 'Published record · Awaiting a field check'}
      </p>
      <SourceNotes
        sourceIds={climb.sourceIds}
        sources={sources}
        label="Climb sources & grade records"
        aliases={climb.aliases}
      />
    </article>
  )
}
