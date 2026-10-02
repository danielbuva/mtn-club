import type { DistributionLicense } from './types'

type AuditedGrant = {
  sourceId: string
  sourceUrl: string
  evidenceUrl: string
  usage: 'open-data' | 'licensed-media'
  licenseIds: DistributionLicense[]
  record: string
}

/** Audited reuse grants and user-directed original asset creation records. */
export const auditedGrants: AuditedGrant[] = [
  {
    sourceId: 'mtn-club-pearl-southeast-guide',
    sourceUrl:
      'https://github.com/danielbuva/mtn-club/blob/feat/kraft-offline-guidebook/public/kraft/pearl-southeast-guide-provenance.json',
    evidenceUrl:
      'https://github.com/danielbuva/mtn-club/blob/feat/kraft-offline-guidebook/public/kraft/pearl-southeast-guide-provenance.json',
    usage: 'licensed-media',
    licenseIds: ['MTN-Club-original'],
    record: 'public/kraft/pearl-southeast-guide-provenance.json',
  },
  {
    sourceId: 'blm-pearl-photograph',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Interesting_Geology_at_Kraft_Mountain_(54084251954).jpg',
    evidenceUrl:
      'https://commons.wikimedia.org/wiki/File:Interesting_Geology_at_Kraft_Mountain_(54084251954).jpg',
    usage: 'licensed-media',
    licenseIds: ['PD-USGov-BLM', 'CC-BY-2.0'],
    record: 'docs/kraft-gauntlet/pearl-photograph.md',
  },
  {
    sourceId: 'osm-kraft-2026-09-30',
    sourceUrl: 'https://www.openstreetmap.org/copyright',
    evidenceUrl: 'https://www.openstreetmap.org/copyright',
    usage: 'open-data',
    licenseIds: ['ODbL-1.0'],
    record: 'public/kraft/geo-license.txt',
  },
  {
    sourceId: 'osm-kraft-west-2026-10-01',
    sourceUrl:
      'https://api.openstreetmap.org/api/0.6/map?bbox=-115.4265,36.156,-115.424,36.166',
    evidenceUrl: 'https://www.openstreetmap.org/copyright',
    usage: 'open-data',
    licenseIds: ['ODbL-1.0'],
    record: 'docs/kraft-gauntlet/source-data/geo-provenance.json',
  },
  {
    sourceId: 'usgs-3dep-2026-10-01',
    sourceUrl:
      'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer',
    evidenceUrl:
      'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    usage: 'open-data',
    licenseIds: ['PD-USGov'],
    record: 'docs/kraft-gauntlet/source-data/geo-provenance.json',
  },
  {
    sourceId: 'usgs-naip-2026-10-01',
    sourceUrl:
      'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/134873?f=pjson',
    evidenceUrl:
      'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    usage: 'open-data',
    licenseIds: ['PD-USGov'],
    record: 'docs/kraft-gauntlet/source-data/geo-provenance.json',
  },
  {
    sourceId: 'usgs-3dep-2026-09-30',
    sourceUrl:
      'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer',
    evidenceUrl:
      'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    usage: 'open-data',
    licenseIds: ['PD-USGov'],
    record: 'docs/kraft-gauntlet/source-data/geo-provenance.json',
  },
  {
    sourceId: 'usgs-naip-2026-09-30',
    sourceUrl:
      'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer',
    evidenceUrl:
      'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits',
    usage: 'open-data',
    licenseIds: ['PD-USGov'],
    record: 'docs/kraft-gauntlet/source-data/geo-provenance.json',
  },
]
