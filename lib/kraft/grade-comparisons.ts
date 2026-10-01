import type { Climb, GradeObservation } from './types'

function comparison(
  grade: string,
  system: GradeObservation['system'],
  sourceId: string,
  sourceName: string,
  identityStatus: GradeObservation['identityStatus'],
  note?: string,
): GradeObservation {
  return {
    grade,
    system,
    sourceId,
    sourceName,
    identityStatus,
    note,
    status: 'source-observation',
  }
}

const monkeyComparisons = [
  {
    id: 'monkey-bars',
    mpFont: '5+',
    topoFont: '6B+',
    sourceId: 'mp-monkey-bars',
    sourceName: 'Monkey Bars',
  },
  {
    id: 'hyperglide',
    mpFont: '6C',
    topoFont: '6C+',
    sourceId: 'mp-hyperglide',
    sourceName: 'Hyperglide',
  },
  {
    id: 'monkey-bar-direct',
    mpFont: '7B',
    topoFont: '7B+',
    sourceId: 'mp-monkey-direct',
    sourceName: 'Monkey Bar Direct',
  },
  {
    id: 'monkey-bar-right',
    mpFont: '7A',
    topoFont: '7A+',
    sourceId: 'mp-monkey-right',
    sourceName: 'Monkey Bar Right',
  },
  {
    id: 'monkey-northeast-left',
    mpFont: '6A',
    topoFont: '6B',
    sourceId: 'mp-monkey-ne',
    sourceName: 'Northeast face left',
  },
]

/** Retain same-name observations without asserting identical starts, variants or finishes. */
export function applyGradeComparisons(climbs: Climb[]) {
  for (const item of monkeyComparisons) {
    const route = climbs.find(climb => climb.id === item.id)
    if (!route) continue
    route.gradeObservations.push(
      comparison(
        item.mpFont,
        'Font',
        item.sourceId,
        route.name,
        'source-linked',
      ),
      comparison(
        item.topoFont,
        'Font',
        'thetopo-monkey',
        item.sourceName,
        'unresolved',
        'Same-name publisher comparison. Physical line identity, starts and variants need local review.',
      ),
    )
    route.sourceIds.push('thetopo-monkey')
    route.disagreement = `Mountain Project lists Font ${item.mpFont}; theTopo lists a same-name entry at ${item.topoFont}. Physical line identity is unresolved. The pilot keeps Mountain Project ${route.grade} for filtering; no grade conversion or consensus is inferred.`
  }

  const plumbers = climbs.find(route => route.id === 'plumbers-crack')
  if (plumbers) {
    plumbers.gradeObservations.push(
      comparison('5.9', 'YDS', 'mp-plumbers', plumbers.name, 'source-linked'),
      comparison(
        'V1',
        'V',
        'kaya-plumbers',
        "Plumber's Crack",
        'unresolved',
        'KAYA describes a chimney with no cardinal face. Identity with the MP south-side offwidth is unresolved.',
      ),
    )
    plumbers.sourceIds.push('kaya-plumbers')
    plumbers.disagreement =
      'Identity unresolved: KAYA’s Plumber’s Crack V1 describes a chimney without a cardinal face; it may refer to a different side. This record follows Mountain Project’s south-side offwidth at V2 / 5.9 with R risk. The north chimney remains Front Side Crack, V0 / 5.8 R.'
  }

  const front = climbs.find(route => route.id === 'front-side-crack')
  if (front)
    front.gradeObservations.push(
      comparison('5.8', 'YDS', 'mp-front-crack', front.name, 'source-linked'),
    )

  const jennas = climbs.find(route => route.id === 'jennas-jewelry')
  if (jennas) {
    jennas.gradeMaxValue = 4
    jennas.gradeObservations.push(
      comparison(
        'V4',
        'V',
        'kaya-kraft',
        jennas.name,
        'unresolved',
        'Same-name public list; exact physical line match has not been reviewed.',
      ),
    )
    jennas.sourceIds.push('kaya-kraft')
    jennas.disagreement =
      'Mountain Project lists V3–4; KAYA has a same-name V4 entry. Identity is unresolved. The pilot keeps the Mountain Project range.'
  }

  const split = climbs.find(route => route.id === 'split-decision')
  if (split) {
    split.gradeObservations.push(
      comparison('5', 'Font', 'mp-split', split.name, 'source-linked'),
      comparison(
        '6B',
        'Font',
        'thetopo-split',
        split.name,
        'unresolved',
        'Same-name entry on a candidate boulder record. Exact line and variant identity are unresolved.',
      ),
    )
    split.sourceIds.push('thetopo-split')
    split.disagreement =
      'Mountain Project lists V1 / Font 5; theTopo lists a same-name Split Decision entry at Font 6B on its candidate Plumber’s Crack boulder. Identity is unresolved; the pilot retains MP V1.'
  }
}
