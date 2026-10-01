import type { Boulder, Climb, KraftGuide } from './types'

export const gradeBands = [
  { id: 'all', label: 'All grades', min: -1, max: 99 },
  { id: 'easy', label: 'V0–V2', min: -1, max: 2 },
  { id: 'moderate', label: 'V3–V5', min: 3, max: 5 },
  { id: 'hard', label: 'V6–V8', min: 6, max: 8 },
  { id: 'expert', label: 'V9+', min: 9, max: 99 },
] as const

export type GradeBandId = (typeof gradeBands)[number]['id']
export type GuideFilters = { query: string; grade: GradeBandId; areaId: string }
export type CatalogClimbReference = { boulder: Boulder; climb: Climb }
export type BoulderResult = {
  boulder: Boulder
  climbs: Climb[]
  referenceClimbs?: CatalogClimbReference[]
}

export function isGradeBand(value: string): value is GradeBandId {
  return gradeBands.some(band => band.id === value)
}

export function searchGuide(
  guide: KraftGuide,
  filters: GuideFilters,
): BoulderResult[] {
  const normalize = (value: string) =>
    value
      .trim()
      .toLocaleLowerCase()
      .replace(/^(.*),\s*(the|an|a)$/, '$2 $1')
      .replaceAll(/['’]/g, '')
  const query = normalize(filters.query)
  const band =
    gradeBands.find(item => item.id === filters.grade) ?? gradeBands[0]
  const results: BoulderResult[] = []
  const routeIndex = new Map(
    guide.boulders.flatMap(boulder =>
      boulder.climbs.map(climb => [climb.id, { boulder, climb }] as const),
    ),
  )
  const gradeMatches = (climb: Climb) =>
    band.id === 'all' ||
    (climb.gradeValue !== null &&
      (climb.gradeMaxValue ?? climb.gradeValue) >= band.min &&
      climb.gradeValue <= band.max)
  const nameMatches = (climb: Climb) =>
    [
      climb.name,
      ...(climb.aliases ?? [])
        .filter(alias => alias.identityStatus === 'source-linked')
        .map(alias => alias.name),
    ].some(name => normalize(name).includes(query))
  for (const boulder of guide.boulders) {
    if (filters.areaId && boulder.areaId !== filters.areaId) continue
    const area = guide.areas.find(item => item.id === boulder.areaId)
    const boulderMatches = [
      boulder.name,
      ...boulder.aliases,
      area?.name ?? '',
    ].some(name => normalize(name).includes(query))
    const climbs = boulder.climbs
      .filter(
        climb => gradeMatches(climb) && (boulderMatches || nameMatches(climb)),
      )
      .toSorted((a, b) => {
        if (!query) return 0
        const score = (climb: Climb) =>
          normalize(climb.name) === query
            ? 0
            : normalize(climb.name).includes(query)
              ? 1
              : 2
        return score(a) - score(b)
      })
    const referencedIds = new Set(
      (boulder.catalogMemberships ?? []).flatMap(item => item.climbIds),
    )
    const referenceClimbs = [...referencedIds].flatMap(id => {
      const reference = routeIndex.get(id)
      return reference &&
        reference.boulder.id !== boulder.id &&
        gradeMatches(reference.climb) &&
        (boulderMatches || nameMatches(reference.climb))
        ? [reference]
        : []
    })
    if (climbs.length || referenceClimbs.length)
      results.push({ boulder, climbs, referenceClimbs })
  }
  return results
}

export function gradeRange(climbs: Climb[]): string {
  const vClimbs = climbs.filter(
    (climb): climb is Climb & { gradeValue: number } =>
      climb.gradeValue !== null,
  )
  if (!vClimbs.length)
    return (
      [...new Set(climbs.map(climb => climb.grade))].join(' · ') ||
      'Grades pending'
    )
  const lower = Math.min(...vClimbs.map(climb => climb.gradeValue))
  const upper = Math.max(
    ...vClimbs.map(climb => climb.gradeMaxValue ?? climb.gradeValue),
  )
  const first = lower < 0 ? 'V-easy' : `V${lower}`
  const last = upper < 0 ? 'V-easy' : `V${upper}`
  const range = first === last ? first : `${first}–${last}`
  return vClimbs.length === climbs.length
    ? range
    : `${range} · other grades recorded`
}
