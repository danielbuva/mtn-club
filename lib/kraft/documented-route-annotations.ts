import { z } from 'zod'
import rawRules from './documented-route-annotation-rules.json' with {
  type: 'json',
}
import type {
  DocumentedAnnotation,
  TopoMovementAnnotation,
  TopoStartAnnotation,
  UnlocatedAnnotation,
} from './route-annotation-types'
import type { Boulder, Climb, RouteFactObservation } from './types'

const numericId = z.string().regex(/^\d+$/)
const startKind = z.enum([
  'matched-hands',
  'two-required-holds',
  'two-hands-on-feature',
  'hands-low',
  'seated-hands-low',
  'required-plus-other',
])
const rulesData = z
  .object({
    review: z.object({ reviewer: z.string(), reviewedAt: z.string() }),
    rules: z.array(
      z.object({
        mpRouteId: numericId,
        mpParentId: numericId,
        retrievedAt: z.string(),
        startFacts: z.array(z.string()),
        startKind: startKind.optional(),
        movementFacts: z
          .object({
            path: z.array(z.string()),
            constraints: z.array(z.string()),
          })
          .optional(),
      }),
    ),
    excluded: z.array(z.object({ mpRouteId: numericId, reason: z.string() })),
  })
  .parse(rawRules)

type Rule = (typeof rulesData.rules)[number]
type RouteEntry = { unit: Boulder; climb: Climb }

export type DocumentedAnnotationApplication = {
  startAnnotations: number
  movementAnnotations: number
  skipped: { mpRouteId: string; reason: string }[]
}

function sameFacts(actual: string[], expected: string[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((fact, index) => fact === expected[index])
  )
}

function sourceEvidence(
  entry: RouteEntry,
  rule: Rule,
): RouteFactObservation | string {
  const { unit, climb } = entry
  if (
    unit.sourceIdentity?.mpId !== rule.mpParentId ||
    unit.sourceIdentity.identityStatus !== 'source-linked' ||
    unit.contentState?.status === 'blocked-identity' ||
    climb.sourceIdentity?.identityStatus !== 'source-linked' ||
    climb.boulderAssignmentStatus !== 'source-backed' ||
    climb.contentState?.status === 'blocked-identity'
  )
    return 'Exact source parent or route identity is unresolved.'

  const observations = (climb.routeFacts?.observations ?? []).filter(
    observation =>
      observation.publisher === 'Mountain Project' &&
      observation.sourceDependency === 'primary-source-page' &&
      observation.retrievedAt === rule.retrievedAt &&
      sameFacts(observation.facts.start, rule.startFacts) &&
      climb.sourceIds.includes(observation.sourceId),
  )
  const observation = observations[0]
  if (observations.length !== 1 || !observation)
    return 'The dated primary-source start facts no longer match exactly.'

  const parents = climb.parentObservations ?? []
  const primaryParents = parents.filter(
    parent => parent.sourceDependency === 'primary-source-page',
  )
  const parent = primaryParents[0]
  if (
    primaryParents.length !== 1 ||
    !parent ||
    parent.identityStatus !== 'source-linked' ||
    parent.sourceId !== observation.sourceId ||
    parent.parentUnitId !== unit.id ||
    parent.parentSourceId !== unit.coverage?.sourceId ||
    parents.some(
      item =>
        item.identityStatus === 'source-linked' &&
        item.parentUnitId !== unit.id,
    )
  )
    return 'The exact primary parent or retained source memberships conflict.'
  return observation
}

function documentaryBase(
  observation: RouteFactObservation,
  rule: string,
): DocumentedAnnotation & { placement: UnlocatedAnnotation } {
  return {
    rule,
    sourceIds: [observation.sourceId],
    review: {
      ...rulesData.review,
      description: `Exact primary-source facts retrieved ${observation.retrievedAt} were reviewed as documentary rules. No publication date, current condition or image-space placement is inferred.`,
    },
    placement: {
      status: 'unlocated',
      reason:
        'The documented start or movement has no separately reviewed image coordinates.',
    },
  }
}

function startAnnotation(
  kind: z.infer<typeof startKind>,
  observation: RouteFactObservation,
): TopoStartAnnotation {
  const base = documentaryBase(observation, observation.facts.start.join(' '))
  if (kind === 'required-plus-other')
    return { ...base, kind, otherHandRule: 'not-described' }
  return { ...base, kind }
}

function movementAnnotation(
  observation: RouteFactObservation,
): TopoMovementAnnotation {
  return {
    ...documentaryBase(observation, observation.facts.path.join(' ')),
    kind: 'dyno-with-static-alternative',
  }
}

/** Documentary rules remain available independently of face imagery or topography. */
export function applyDocumentedRouteAnnotations(
  boulders: Boulder[],
): DocumentedAnnotationApplication {
  const result: DocumentedAnnotationApplication = {
    startAnnotations: 0,
    movementAnnotations: 0,
    skipped: [],
  }
  const entries = new Map<string, RouteEntry[]>()
  for (const unit of boulders)
    for (const climb of unit.climbs) {
      const mpId = climb.sourceIdentity?.mpId
      if (!mpId) continue
      const existing = entries.get(mpId) ?? []
      existing.push({ unit, climb })
      entries.set(mpId, existing)
    }

  for (const excluded of rulesData.excluded)
    if (entries.has(excluded.mpRouteId)) result.skipped.push({ ...excluded })

  for (const rule of rulesData.rules) {
    const matches = entries.get(rule.mpRouteId) ?? []
    const entry = matches[0]
    if (matches.length !== 1 || !entry) {
      result.skipped.push({
        mpRouteId: rule.mpRouteId,
        reason: 'The exact MP route is missing or appears more than once.',
      })
      continue
    }
    const observation = sourceEvidence(entry, rule)
    if (typeof observation === 'string') {
      result.skipped.push({ mpRouteId: rule.mpRouteId, reason: observation })
      continue
    }
    const annotations = { ...entry.climb.routeAnnotations }
    if (rule.startKind) {
      if (annotations.start)
        result.skipped.push({
          mpRouteId: rule.mpRouteId,
          reason: 'An existing start annotation is preserved.',
        })
      else {
        annotations.start = startAnnotation(rule.startKind, observation)
        result.startAnnotations += 1
      }
    }
    if (rule.movementFacts) {
      if (annotations.movement)
        result.skipped.push({
          mpRouteId: rule.mpRouteId,
          reason: 'An existing movement annotation is preserved.',
        })
      else if (
        !sameFacts(observation.facts.path, rule.movementFacts.path) ||
        !sameFacts(
          observation.facts.constraints,
          rule.movementFacts.constraints,
        )
      )
        result.skipped.push({
          mpRouteId: rule.mpRouteId,
          reason: 'The documented same-climb movement alternatives changed.',
        })
      else {
        annotations.movement = movementAnnotation(observation)
        result.movementAnnotations += 1
      }
    }
    if (annotations.start || annotations.movement)
      entry.climb.routeAnnotations = annotations
  }
  return result
}
