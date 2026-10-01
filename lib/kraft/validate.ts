import type { KraftGuide } from './types'
import { validateCatalogRecords } from './validate-catalog.ts'
import { validateEvidenceDates } from './validate-dates.ts'
import { validateGuideEnums } from './validate-enums.ts'
import { validateBoulderEvidence } from './validate-evidence.ts'
import { validateFieldEvidence } from './validate-field-evidence.ts'
import { validateFieldGuideRelease } from './validate-release.ts'
import { validateDistributionRights } from './validate-rights.ts'

/** Content publication checks. Test fixtures may use separate, identified assets. */
export function validateGuide(guide: KraftGuide): string[] {
  const errors: string[] = [
    ...validateGuideEnums(guide),
    ...validateDistributionRights(guide),
    ...validateEvidenceDates(guide),
    ...validateFieldEvidence(guide),
    ...validateFieldGuideRelease(guide),
    ...validateCatalogRecords(guide),
  ]
  const sources = new Set(guide.sources.map(source => source.id))
  const assets = new Map(guide.assets.map(asset => [asset.id, asset]))
  const areas = new Set(guide.areas.map(area => area.id))
  const ids = new Set<string>()
  const sourceIds = new Set<string>()
  function identify(id: string, domain = ids) {
    if (domain.has(id)) errors.push(`Duplicate content ID: ${id}`)
    domain.add(id)
  }
  function checkSources(owner: string, sourceIds: string[]) {
    if (!sourceIds.length) errors.push(`${owner} has no evidence source`)
    for (const id of sourceIds)
      if (!sources.has(id)) errors.push(`${owner}: unknown source ${id}`)
  }
  for (const source of guide.sources) identify(source.id, sourceIds)
  for (const area of guide.areas) {
    identify(area.id)
    checkSources(area.id, area.sourceIds)
  }
  for (const asset of guide.assets) {
    if (!asset.license || !asset.attribution)
      errors.push(`${asset.id}: asset rights missing`)
    if (!asset.src.startsWith('/kraft/') || asset.src.includes('..'))
      errors.push(`${asset.id}: expected local guide asset`)
    checkSources(asset.id, asset.sourceIds)
  }
  for (const boulder of guide.boulders) {
    errors.push(...validateBoulderEvidence(boulder, sources))
    identify(boulder.id)
    checkSources(boulder.id, boulder.sourceIds)
    if (boulder.location)
      checkSources(`${boulder.id} location`, boulder.location.sourceIds)
    if (!areas.has(boulder.areaId)) errors.push(`${boulder.id}: unknown area`)
    if (
      boulder.location &&
      (!Number.isFinite(boulder.location.lat) ||
        !Number.isFinite(boulder.location.lon))
    )
      errors.push(`${boulder.id}: invalid coordinate`)
    const faces = new Map(boulder.faces.map(face => [face.id, face]))
    for (const face of boulder.faces) {
      identify(face.id)
      checkSources(face.id, face.sourceIds)
      if (face.image.status === 'available') {
        const asset = assets.get(face.image.assetId)
        if (
          !asset ||
          asset.kind !== 'face-photo' ||
          asset.src !== face.image.src
        )
          errors.push(
            `${face.id}: photograph is not in licensed download inventory`,
          )
        if (face.image.width <= 0 || face.image.height <= 0)
          errors.push(`${face.id}: invalid image dimensions`)
      }
      for (const id of face.climbIds)
        if (
          !boulder.climbs.some(
            climb => climb.id === id && climb.faceIds.includes(face.id),
          )
        )
          errors.push(`${face.id}: inconsistent climb ${id}`)
    }
    for (const climb of boulder.climbs) {
      identify(climb.id)
      checkSources(climb.id, climb.sourceIds)
      if (
        climb.gradeValue !== null &&
        (!Number.isFinite(climb.gradeValue) ||
          (climb.gradeMaxValue ?? climb.gradeValue) < climb.gradeValue)
      )
        errors.push(`${climb.id}: invalid grade range`)
      for (const observation of climb.gradeObservations)
        checkSources(`${climb.id} grade`, [observation.sourceId])
      for (const id of climb.faceIds)
        if (!faces.get(id)?.climbIds.includes(climb.id))
          errors.push(`${climb.id}: inconsistent face ${id}`)
      for (const geometry of climb.geometry) {
        const face = faces.get(geometry.faceId)
        if (!face || !climb.faceIds.includes(geometry.faceId))
          errors.push(`${climb.id}: geometry face is unassigned`)
        if (geometry.status !== 'authored') continue
        checkSources(`${climb.id} geometry`, geometry.sourceIds)
        if (!geometry.reviewedAt || !geometry.path.trim())
          errors.push(`${climb.id}: route authoring review missing`)
        if (face?.image.status !== 'available')
          errors.push(`${climb.id}: authored line has no licensed photograph`)
        if (geometry.continuation && !faces.has(geometry.continuation.faceId))
          errors.push(`${climb.id}: unknown wrap face`)
      }
    }
  }
  return errors
}
