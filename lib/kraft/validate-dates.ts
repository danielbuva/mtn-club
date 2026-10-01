import type { KraftGuide } from './types'

export function isEvidenceDate(value: unknown, today: string): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value &&
    value <= today
  )
}

/** Dates describe evidence, never a guessed break date or a future review. */
export function validateEvidenceDates(guide: KraftGuide): string[] {
  const errors: string[] = []
  const today = new Date().toISOString().slice(0, 10)
  const sources = new Map(guide.sources.map(source => [source.id, source]))
  function date(owner: string, label: string, value: unknown) {
    if (!isEvidenceDate(value, today))
      errors.push(`${owner}: invalid or future ${label} date`)
  }
  function retrieval(owner: string, value: string, sourceId?: string) {
    if (
      !isEvidenceDate(value.slice(0, 10), today) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value.slice(0, 10)
    )
      errors.push(`${owner}: invalid or future source retrieval timestamp`)
    if (value.slice(0, 10) > guide.reviewedAt)
      errors.push(`${owner}: source retrieval follows the guide review date`)
    const source = sourceId ? sources.get(sourceId) : undefined
    if (source?.retrievedAt && source.retrievedAt !== value)
      errors.push(`${owner}: source retrieval contradicts referenced evidence`)
  }
  function review(
    owner: string,
    value: { reviewer: string; reviewedAt: string } | undefined,
  ) {
    if (!value) return
    if (!value.reviewer?.trim()) errors.push(`${owner}: named reviewer missing`)
    date(owner, 'review', value.reviewedAt)
    if (value.reviewedAt > guide.reviewedAt)
      errors.push(`${owner}: review date follows the guide review date`)
  }
  function reported(
    owner: string,
    sourceId: string,
    reportedAt: string | undefined,
  ) {
    const source = sources.get(sourceId)
    if (reportedAt !== undefined) date(owner, 'reported', reportedAt)
    if (
      (reportedAt !== undefined || source?.publishedAt !== undefined) &&
      reportedAt !== source?.publishedAt
    )
      errors.push(`${owner}: reported date contradicts dated source evidence`)
  }
  date(guide.id, 'guide review', guide.reviewedAt)
  for (const source of guide.sources) {
    if (source.retrievedAt) {
      retrieval(source.id, source.retrievedAt)
      if (source.retrievedAt.slice(0, 10) !== source.accessedAt)
        errors.push(`${source.id}: source retrieval contradicts access date`)
    }
    date(source.id, 'source access', source.accessedAt)
    if (source.accessedAt > guide.reviewedAt)
      errors.push(`${source.id}: source access follows the guide review date`)
    if (source.publishedAt !== undefined) {
      date(source.id, 'source publication', source.publishedAt)
      if (source.publishedAt > source.accessedAt)
        errors.push(`${source.id}: source publication follows access date`)
    }
  }
  for (const boulder of guide.boulders) {
    review(`${boulder.id} location`, boulder.location?.review)
    for (const observation of [
      ...(boulder.location?.observations ?? []),
      ...(boulder.coordinateObservations ?? []),
    ])
      review(
        `${boulder.id} coordinate ${observation.sourceId}`,
        observation.review,
      )
    for (const face of boulder.faces) review(face.id, face.review)
    for (const climb of boulder.climbs) {
      for (const observation of climb.routeFacts?.observations ?? [])
        retrieval(
          `${climb.id} facts`,
          observation.retrievedAt,
          observation.sourceId,
        )
      for (const observation of climb.coordinateObservations ?? [])
        review(
          `${climb.id} coordinate ${observation.sourceId}`,
          observation.review,
        )
      review(climb.id, climb.review)
      for (const observation of climb.gradeObservations)
        reported(
          `${climb.id} grade`,
          observation.sourceId,
          observation.reportedAt,
        )
      for (const observation of climb.conditionObservations ?? [])
        reported(
          `${climb.id} condition`,
          observation.sourceId,
          observation.reportedAt,
        )
      for (const geometry of climb.geometry) {
        if (geometry.status !== 'authored') continue
        date(`${climb.id} geometry`, 'authoring review', geometry.reviewedAt)
        if (geometry.reviewedAt > guide.reviewedAt)
          errors.push(
            `${climb.id}: authoring review follows the guide review date`,
          )
        if (climb.review && geometry.reviewedAt > climb.review.reviewedAt)
          errors.push(
            `${climb.id}: geometry review follows its physical review`,
          )
      }
    }
  }
  return errors
}
