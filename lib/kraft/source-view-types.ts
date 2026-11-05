import type { RouteFactFields } from './catalog-types'
import type { SourceFaceOrientation } from './source-face-types'

export type SourceViewFactRule = {
  mpRouteId: string
  factField: keyof RouteFactFields
  sourceFact: string
}

export type SourceViewGroup = {
  mpParentId: string
  key: string
  orientation: SourceFaceOrientation | 'unknown'
  routes: Record<string, string | Omit<SourceViewFactRule, 'mpRouteId'>>
  relations: SourceViewFactRule[]
  faceId?: string
  assignmentStatus?: 'source-backed' | 'editorial-provisional'
}
