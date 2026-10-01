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
export type BoulderResult = { boulder: Boulder; climbs: Climb[] }

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
  for (const boulder of guide.boulders) {
    if (filters.areaId && boulder.areaId !== filters.areaId) continue
    const area = guide.areas.find(item => item.id === boulder.areaId)
    const boulderMatches = [
      boulder.name,
      ...boulder.aliases,
      area?.name ?? '',
    ].some(name => normalize(name).includes(query))
    const climbs = boulder.climbs.filter(
      climb =>
        (climb.gradeMaxValue ?? climb.gradeValue) >= band.min &&
        climb.gradeValue <= band.max &&
        (boulderMatches ||
          [
            climb.name,
            ...(climb.aliases ?? [])
              .filter(alias => alias.identityStatus === 'source-linked')
              .map(alias => alias.name),
          ].some(name => normalize(name).includes(query))),
    )
    if (climbs.length) results.push({ boulder, climbs })
  }
  return results
}

export function gradeRange(climbs: Climb[]): string {
  if (!climbs.length) return 'Grades pending'
  const lower = Math.min(...climbs.map(climb => climb.gradeValue))
  const upper = Math.max(
    ...climbs.map(climb => climb.gradeMaxValue ?? climb.gradeValue),
  )
  const first = lower < 0 ? 'VB' : `V${lower}`
  const last = upper < 0 ? 'VB' : `V${upper}`
  return first === last ? first : `${first}–${last}`
}
