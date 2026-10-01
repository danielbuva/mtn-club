export interface LinkRecord {
  id: string
  url: string
  name: string
}
export interface Coordinate {
  latitude: number
  longitude: number
}
export interface GradeObservation {
  system: string
  grade: string
  sourceClass: string
  sourceLabel: string
  text: string
}
export interface ParsedGrades {
  text: string
  v: string
  yds: string
  font: string
  risk: string
  observations: GradeObservation[]
}
export interface RouteListing extends LinkRecord {
  gradeText: string
  vGrade: string
  ydsGrade: string
  fontGrade: string
  gradeObservations: GradeObservation[]
  risk: string
  routeTypes: string[]
  sourceOrderLeftToRight: number | null
}
export interface ParsedPage {
  name: string
  coordinates: Coordinate | null
  typeText: string | null
  grades: ParsedGrades | null
  declaredTotal: number | null
  children: LinkRecord[]
  routeListings: RouteListing[]
  breadcrumb: LinkRecord[]
  sections: { heading: string; characterCount: number; noUsefulText: boolean }[]
  photoReferences: string[]
  commentCount: number | null
}
export interface AreaRecord extends LinkRecord {
  parentId: string | null
  kind: 'root' | 'sector' | 'subarea-or-group' | 'source-boulder-unit'
  retrievedAt: string
  coordinates: Coordinate | null
  declaredTotal: number | null
  childIds: string[]
  directRouteIds: string[]
  breadcrumb: LinkRecord[]
  detailSections: ParsedPage['sections']
  photoReferences: string[]
}
export interface RouteRecord extends RouteListing {
  parentId: string
  parentIds: string[]
  retrievedAt: string
  detailRetrievedAt: string | null
  coordinates: Coordinate | null
  detailGrade: ParsedPage['grades']
  detailType: string | null
  breadcrumb: LinkRecord[]
  detailSections: ParsedPage['sections']
  photoReferences: string[]
  commentCount: number | null
  detailStatus: 'pending' | 'retrieved' | 'failed'
}
export interface AcquisitionError {
  url: string
  attempt: number
  message: string
  at: string
}
