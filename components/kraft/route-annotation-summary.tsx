import { resolveRouteAnnotations } from '@/lib/kraft/resolve-route-annotations'
import { routeAnnotationSummaries } from '@/lib/kraft/route-annotations'
import type { Climb, EvidenceSource, Face } from '@/lib/kraft/types'
import styles from './topo.module.css'

export function RouteAnnotationSummary({
  climb,
  face,
  sources = [],
  citeSources = false,
}: {
  climb: Climb
  face: Face | null
  sources?: EvidenceSource[]
  citeSources?: boolean
}) {
  const geometry = climb.geometry.find(item => item.faceId === face?.id)
  const image = face?.image.status === 'available' ? face.image : undefined
  const annotations = resolveRouteAnnotations(
    climb.routeAnnotations,
    geometry?.status === 'authored' ? geometry.annotations : undefined,
    { sourceIds: climb.sourceIds, image },
  )
  if (!annotations) return null
  const summaries = routeAnnotationSummaries(annotations)
  const records = [annotations.start, annotations.movement].flatMap(
    annotation => (annotation ? [annotation] : []),
  )
  const sourceIds = [
    ...new Set(records.flatMap(record => [...record.sourceIds])),
  ]
  const dates = [
    ...new Set(
      records.flatMap(record => (record.reportedAt ? [record.reportedAt] : [])),
    ),
  ]
  return (
    <div className={styles.annotationSummary}>
      <p>{summaries.join(' ')}</p>
      {citeSources && (
        <small>
          Documented source rules{dates.length > 0 && ` · ${dates.join(', ')}`}{' '}
          ·{' '}
          {climb.status === 'field-verified' ||
          records.every(
            record =>
              record.placement.status === 'reviewed' &&
              record.placement.method === 'field-verified',
          )
            ? 'Checked at the boulder.'
            : 'Awaiting a field check.'}
          {sourceIds.map(id => {
            const source = sources.find(item => item.id === id)
            return source ? (
              <span key={id}>
                {' '}
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </span>
            ) : null
          })}
        </small>
      )}
    </div>
  )
}
