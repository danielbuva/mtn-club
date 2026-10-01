import type {
  ConditionObservation,
  GradeObservation,
  SourceAlias,
} from './types'

export type RouteFacts = {
  description: string
  faceIds?: string[]
  sourceIds?: string[]
  aliases?: SourceAlias[]
  boulderAssignmentNote?: string
  gradeObservations?: GradeObservation[]
  conditionObservations?: ConditionObservation[]
  disagreement?: string
}
