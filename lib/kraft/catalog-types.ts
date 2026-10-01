import type { EvidenceStatus, IdentityStatus } from './types'

export type SourceDependency =
  | 'primary-source-page'
  | 'correlated-mp-import'
  | 'origin-unresolved'

export type ContentState = {
  status:
    | 'partial'
    | 'blocked-lawful-image'
    | 'blocked-identity'
    | 'blocked-evidence'
    | 'excluded'
    | 'complete'
  confidence: EvidenceStatus | 'identity-unresolved'
  reasons: string[]
}

export type SourceIdentity = {
  mpId: string | null
  openBetaIds: string[]
  identityStatus: IdentityStatus
}

export type RouteFactFields = {
  face: string[]
  start: string[]
  path: string[]
  finish: string[]
  constraints: string[]
  approach: string[]
}

export type RouteFactObservation = {
  sourceId: string
  publisher: 'Mountain Project' | 'OpenBeta'
  retrievedAt: string
  sourceDependency: SourceDependency
  sectionAvailability: {
    description: 'present' | 'absent'
    location: 'present' | 'absent'
  }
  facts: RouteFactFields
  synopsis: string
  unresolved: string[]
}

export type StructuredRouteFacts = RouteFactFields & {
  observations: RouteFactObservation[]
  discrepancyNotes: string[]
  unresolved: string[]
}

export type ParentObservation = {
  sourceId: string
  parentSourceId: string
  parentUnitId: string | null
  identityStatus: IdentityStatus
  sourceDependency: SourceDependency
  note: string
}
