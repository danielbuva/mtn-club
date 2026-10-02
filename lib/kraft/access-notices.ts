import type { Boulder, Climb } from './types'

export type ClimbingAccessNotice = {
  status: 'climbing-closed'
  mpAreaId: string
  mpRouteIds: readonly string[]
  summary: string
  source: {
    id: string
    publisher: 'Mountain Project'
    title: string
    url: string
    checkedAt: string
  }
  reportedSignDate: string
}

export const accessClosedLabel = 'Climbing closed · Mountain Project'

/** Factual paraphrase of the dated MP access block, not a field access review. */
const calimanNotice: ClimbingAccessNotice = {
  status: 'climbing-closed',
  mpAreaId: '106800767',
  mpRouteIds: ['106802769', '106800770', '106800785', '106800777'],
  summary:
    'Mountain Project reports that climbing on Caliman Boulder is prohibited because it lies within 50 feet of cultural sites.',
  source: {
    id: 'mp-area-106800767',
    publisher: 'Mountain Project',
    title: 'Caliman Boulder access notice',
    url: 'https://www.mountainproject.com/area/106800767/caliman-boulder',
    checkedAt: '2026-10-01',
  },
  reportedSignDate: '2012-04-06',
}

export function boulderAccessNotice(
  boulder: Pick<Boulder, 'sourceIdentity'>,
): ClimbingAccessNotice | null {
  const identity = boulder.sourceIdentity
  return identity?.identityStatus === 'source-linked' &&
    identity.mpId === calimanNotice.mpAreaId
    ? calimanNotice
    : null
}

export function climbAccessNotice(
  climb: Pick<Climb, 'sourceIdentity' | 'parentObservations'>,
): ClimbingAccessNotice | null {
  const identity = climb.sourceIdentity
  if (
    identity?.identityStatus !== 'source-linked' ||
    !identity.mpId ||
    !calimanNotice.mpRouteIds.includes(identity.mpId)
  )
    return null
  return climb.parentObservations?.some(
    parent =>
      parent.parentSourceId === calimanNotice.source.id &&
      parent.identityStatus === 'source-linked' &&
      parent.sourceDependency === 'primary-source-page',
  )
    ? calimanNotice
    : null
}
