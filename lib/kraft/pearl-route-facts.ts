import type { RouteFacts } from './route-facts'

export const pearlRouteFacts: Record<string, RouteFacts> = {
  'pearl-across-the-choss': {
    description:
      'East-side warm-up on The Pearl. The source does not specify starting holds or a reviewed photographic view.',
  },
  'pearl-clam-bumper-right': {
    description:
      'Shares The Clam Bumper’s start, visits the juggy crack to the left, then returns right for a jug finish.',
  },
  'pearl-the-clam-bumper': {
    description:
      'Standing start on a ramp to the right of The Pearl. The climb uses awkwardly oriented holds; the precise photographic view is unresolved.',
    gradeObservations: [
      {
        grade: 'V4',
        system: 'V',
        sourceId: 'mp-route-106652005',
        sourceName: 'The Clam Bumper',
        status: 'source-observation',
        identityStatus: 'unresolved',
        note: 'MP route prose reports a Jenson guidebook V4. The original guidebook page and exact line comparison were not reviewed.',
      },
    ],
    disagreement:
      'The selected parent table lists V3. MP route prose reports Jenson guidebook V4; the original page and exact line identity remain unresolved. The guide retains the MP table grade.',
  },
  'pearl-northeast-corner': {
    description:
      'Jug line on the northeast corner separating the east and north faces. A corner description alone does not establish its fit in the northeast photo view.',
  },
  'pearl-pearl-necklace': {
    description:
      'A lower seated entry into The Pearl’s standing start. The source reports that erosion has changed low foothold options; present conditions need review.',
    faceIds: ['pearl-southeast'],
  },
  'pearl-the-spreader': {
    description:
      'Central flake line with jug climbing, layback and crack-jamming options. The source does not name a cardinal face.',
  },
  'pearl-vajazzled': {
    description:
      'East-face linkup from left-side jugs, traversing right into Jenna’s Jewelry and its dynamic finish. Its full photographic extent remains unresolved.',
  },
}
