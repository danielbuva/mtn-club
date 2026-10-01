import type { CoordinateObservation } from './types'

function observation(
  lat: number,
  lon: number,
  sourceId: string,
  selection: CoordinateObservation['selection'],
  selectionReason: string,
): CoordinateObservation {
  return {
    lat,
    lon,
    sourceId,
    selection,
    selectionReason,
    status: 'source-observation',
  }
}

export const kraftCoordinateObservations: Record<
  string,
  CoordinateObservation[]
> = {
  cube: [
    observation(
      36.15974,
      -115.41913,
      'mp-cube',
      'selected',
      'Use the physical boulder record; route points conflict with the parent hierarchy.',
    ),
    observation(
      36.09296,
      -115.3238,
      'mp-perfect-poser',
      'rejected',
      'Perfect Poser route point is outside Kraft and conflicts with its parent Cube record.',
    ),
  ],
  'split-boulder': [
    observation(
      36.15993,
      -115.41713,
      'mp-split',
      'selected',
      'Use the physical boulder record rather than contradictory individual route points.',
    ),
    observation(
      45.64115,
      -111.00098,
      'mp-front-crack',
      'rejected',
      'Front Side Crack route point is in Montana, inconsistent with its Kraft parent.',
    ),
    observation(
      36.15675,
      -115.42212,
      'mp-plumbers',
      'rejected',
      "Plumber's Crack route point differs from its parent Split Boulder record.",
    ),
    observation(
      36.159949,
      -115.417154,
      'thetopo-split',
      'comparison',
      "Nearby theTopo boulder named Plumber's Crack. Candidate physical identity remains unresolved; do not average coordinates.",
    ),
  ],
  pearl: [
    observation(
      36.15924,
      -115.41487,
      'mp-pearl',
      'selected',
      'Use The Pearl physical boulder record rather than its enclosing area coordinate.',
    ),
  ],
  'monkey-bar': [
    observation(
      36.15693,
      -115.42073,
      'mp-route-107849034',
      'rejected',
      'The Monkey Crack route point differs from the parent despite route prose identifying the parent’s southeast side. Retain the discrepancy; use the parent point for catalog placement.',
    ),
    observation(
      36.16154,
      -115.41099,
      'mp-monkey',
      'selected',
      'Use the physical boulder record; its route page GPS and outbound map-link fragment disagree.',
    ),
    observation(
      36.15044,
      -115.41981,
      'mp-monkey-bars',
      'rejected',
      'Monkey Bars route point is about 1.47 km from its parent boulder and conflicts with the outbound onX map-link coordinate.',
    ),
    observation(
      36.16154,
      -115.41099,
      'mp-monkey-onx-link',
      'comparison',
      'The Monkey Bars page links to an onX map fragment at the parent coordinate. This is a linked comparison, not independent verification.',
    ),
    observation(
      36.161478,
      -115.410975,
      'thetopo-monkey',
      'comparison',
      'Separately published theTopo boulder coordinate. Retain the observation; do not treat decimal precision as accuracy.',
    ),
  ],
}
