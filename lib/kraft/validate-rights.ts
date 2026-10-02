import { auditedGrants } from './audited-grants.ts'
import type {
  DistributionLicense,
  DistributionRights,
  EvidenceSource,
  KraftGuide,
} from './types'

const licenseLabels: Record<DistributionLicense, string> = {
  'CC-BY-2.0': 'CC BY 2.0',
  'PD-USGov-BLM': 'Public domain (U.S.)',
  'PD-USGov': 'U.S. federal government public domain',
  'ODbL-1.0': 'Open Database License 1.0',
  'MTN-Club-original': 'Original MTN Club guide asset',
}

function matchesAuditedGrant(source: EvidenceSource): boolean {
  const audited = auditedGrants.find(grant => grant.sourceId === source.id)
  return (
    validGrant(source.distribution, source.license) &&
    !!audited &&
    source.url === audited.sourceUrl &&
    source.usage === audited.usage &&
    source.distribution?.evidenceUrl === audited.evidenceUrl &&
    source.distribution?.licenseIds.join('|') === audited.licenseIds.join('|')
  )
}

function validGrant(
  rights: DistributionRights | undefined,
  label: string | undefined,
): boolean {
  if (
    !rights ||
    !Array.isArray(rights.licenseIds) ||
    !rights.licenseIds.length ||
    !rights.licenseIds.every(id => Object.hasOwn(licenseLabels, id)) ||
    new Set(rights.licenseIds).size !== rights.licenseIds.length
  )
    return false
  try {
    const url = new URL(rights.evidenceUrl)
    if (!['https:', 'http:'].includes(url.protocol)) return false
  } catch {
    return false
  }
  return label === rights.licenseIds.map(id => licenseLabels[id]).join(' / ')
}

/** Arbitrary rights prose and factual references cannot authorize shipped media. */
export function validateDistributionRights(guide: KraftGuide): string[] {
  const errors: string[] = []
  const sources = new Map(guide.sources.map(source => [source.id, source]))
  for (const source of guide.sources) {
    if (
      source.usage !== 'factual-reference' &&
      (!validGrant(source.distribution, source.license) ||
        !matchesAuditedGrant(source))
    )
      errors.push(`${source.id}: supported source distribution rights missing`)
  }
  for (const asset of guide.assets) {
    if (!validGrant(asset.distribution, asset.license))
      errors.push(`${asset.id}: supported asset distribution rights missing`)
    const expectedUsage =
      asset.kind === 'face-photo' ? 'licensed-media' : 'open-data'
    const declared = new Set(
      Array.isArray(asset.distribution?.licenseIds)
        ? asset.distribution.licenseIds
        : [],
    )
    const evidenced = new Set<DistributionLicense>()
    for (const sourceId of asset.sourceIds) {
      const source = sources.get(sourceId)
      if (
        !source ||
        source.usage !== expectedUsage ||
        !validGrant(source.distribution, source.license) ||
        !matchesAuditedGrant(source)
      ) {
        errors.push(
          `${asset.id}: ${sourceId} cannot authorize ${asset.kind} distribution`,
        )
        continue
      }
      for (const id of source.distribution?.licenseIds ?? []) evidenced.add(id)
    }
    if (
      !asset.sourceIds.some(id => {
        const source = sources.get(id)
        return (
          source &&
          matchesAuditedGrant(source) &&
          source.distribution?.evidenceUrl === asset.distribution?.evidenceUrl
        )
      })
    )
      errors.push(
        `${asset.id}: asset rights evidence is not its audited source grant`,
      )
    if (
      declared.size !== evidenced.size ||
      [...declared].some(id => !evidenced.has(id))
    )
      errors.push(
        `${asset.id}: asset distribution grant contradicts its sources`,
      )
    if (asset.kind === 'face-photo' && declared.has('ODbL-1.0'))
      errors.push(
        `${asset.id}: database rights cannot authorize a face photograph`,
      )
  }
  return errors
}
