import { cubeClimbs, monkeyClimbs, pearlClimbs, splitClimbs } from './climbs.ts'
import { kraftCoordinateObservations } from './location-observations.ts'
import type { Boulder, Climb, Face } from './types'

const photoGap =
  'A licensed, identified photograph of this face is still needed.'

function face(
  id: string,
  name: string,
  orientation: string,
  sourceIds: string[],
  climbs: Climb[],
): Face {
  return {
    id,
    name,
    orientation,
    orientationStatus:
      orientation === 'Unconfirmed' ? 'unknown' : 'source-observation',
    groupingStatus:
      id === 'monkey-cave' ? 'editorial-provisional' : 'source-backed',
    image: { status: 'missing', reason: photoGap },
    sourceIds,
    climbIds: climbs
      .filter(route => route.faceIds.includes(id))
      .map(route => route.id),
  }
}

export const pilotBoulders: Boulder[] = [
  {
    id: 'cube',
    name: 'The Cube',
    aliases: ['Cube'],
    aliasObservations: [
      { name: 'Cube', sourceId: 'mp-cube', identityStatus: 'source-linked' },
    ],
    areaId: 'cube-area',
    areaAssignmentStatus: 'source-backed',
    coverage: {
      status: 'source-catalog',
      sourceId: 'mp-cube',
      sourceClimbCount: 12,
    },
    location: {
      lat: 36.15974,
      lon: -115.41913,
      status: 'source-observation',
      sourceIds: ['mp-cube'],
      observations: kraftCoordinateObservations.cube,
      note: 'Parent boulder location. The Perfect Poser route coordinate is inconsistent and is excluded.',
    },
    description:
      'Large highball boulder by the main trail junction north of the parking area.',
    approach:
      'From the northeast corner of parking, follow the trail north to the main east–west trail junction.',
    sourceIds: ['mp-cube'],
    climbs: cubeClimbs,
    faces: [
      face('cube-west', 'West face', 'W', ['mp-west-face-left'], cubeClimbs),
      face('cube-south', 'South arête', 'S', ['mp-black-hat'], cubeClimbs),
      face(
        'cube-north',
        'North face',
        'N',
        ['mp-route-111470042', 'mp-cube'],
        cubeClimbs,
      ),
    ],
  },
  {
    id: 'split-boulder',
    name: 'Split Boulder',
    aliases: ['The Split Boulder'],
    aliasObservations: [
      {
        name: 'The Split Boulder',
        sourceId: 'mp-split',
        identityStatus: 'source-linked',
      },
      {
        name: "Plumber's Crack",
        sourceId: 'thetopo-split',
        identityStatus: 'unresolved',
        note: 'Candidate boulder name from a nearby theTopo coordinate. Keep separate from the north chimney and south offwidth route identities.',
      },
    ],
    areaId: 'main-area',
    areaAssignmentStatus: 'source-backed',
    coverage: {
      status: 'source-catalog',
      sourceId: 'mp-split',
      sourceClimbCount: 9,
    },
    location: {
      lat: 36.15993,
      lon: -115.41713,
      status: 'source-observation',
      sourceIds: ['mp-split'],
      observations: kraftCoordinateObservations['split-boulder'],
      note: 'Parent boulder location. Front Side Crack and Plumber’s Crack route coordinates differ and are excluded.',
    },
    description:
      'Tall split rock with a north-side chimney and a south-side offwidth.',
    approach:
      'On the west side of the Main Area cluster, uphill from the main trail. The final approach needs a field track.',
    sourceIds: ['mp-split', 'thetopo-split'],
    climbs: splitClimbs,
    faces: [
      face(
        'split-north',
        'North · uphill',
        'N',
        ['mp-front-crack'],
        splitClimbs,
      ),
      face(
        'split-south',
        'South · downhill',
        'S',
        ['mp-plumbers'],
        splitClimbs,
      ),
    ],
  },
  {
    id: 'pearl',
    name: 'The Pearl',
    aliases: [],
    areaId: 'pearl-area',
    areaAssignmentStatus: 'source-backed',
    coverage: {
      status: 'source-catalog',
      sourceId: 'mp-pearl',
      sourceClimbCount: 11,
    },
    location: {
      lat: 36.15924,
      lon: -115.41487,
      status: 'source-observation',
      sourceIds: ['mp-pearl'],
      observations: kraftCoordinateObservations.pearl,
    },
    description:
      'Trailside boulder with a smooth southeast face and climbing on its northeast side.',
    approach:
      'Continue east on the main trail from The Cube, past the Main Area. The Pearl sits beside the trail.',
    sourceIds: ['mp-pearl'],
    climbs: pearlClimbs,
    faces: [
      {
        ...face(
          'pearl-southeast',
          'Southeast face',
          'SE',
          [
            'mp-pearl-route',
            'blm-pearl-photograph',
            'mp-pearl-view-reference',
            'mtn-club-pearl-southeast-guide',
          ],
          pearlClimbs,
        ),
        image: {
          status: 'available',
          src: '/kraft/pearl-southeast-guide.webp',
          width: 1448,
          height: 1086,
          alt: 'Original near-frontal reconstruction of The Pearl sandstone boulder at Kraft, showing its steep southeast surface, shoulder lip and adjoining ramp.',
          assetId: 'pearl-southeast-guide',
          representation: 'reconstruction',
        },
        photographNote:
          'Original MTN Club reconstruction from an independently composed near-frontal camera and multiple factual photo references. Generated surface details are illustrative; human review, field verification and current hold conditions remain unverified.',
      },
      face(
        'pearl-northeast',
        'Northeast face',
        'NE',
        ['mp-pearl-ne'],
        pearlClimbs,
      ),
    ],
  },
  {
    id: 'monkey-bar',
    name: 'Monkey Bar Boulder',
    aliases: [],
    areaId: 'east-cluster',
    areaAssignmentStatus: 'source-backed',
    coverage: {
      status: 'source-catalog',
      sourceId: 'mp-monkey',
      sourceClimbCount: 26,
    },
    location: {
      lat: 36.16154,
      lon: -115.41099,
      status: 'source-observation',
      sourceIds: ['mp-monkey'],
      observations: kraftCoordinateObservations['monkey-bar'],
      note: 'The Monkey Bars route point conflicts with its parent and outbound onX link. Both are retained as observations; the parent point is selected. theTopo has a separate nearby observation.',
    },
    description:
      'Eastern boulder with a jugged cave, uphill roof and several distinct faces.',
    approach:
      'Follow the Kraft Mountain Loop Trail east from The Cube. The trail branches around both sides of the boulder.',
    sourceIds: ['mp-monkey', 'thetopo-monkey'],
    climbs: monkeyClimbs,
    faces: [
      face(
        'monkey-cave',
        'Cave & roof',
        'Unconfirmed',
        ['mp-monkey-bars', 'mp-hyperglide', 'mp-monkey-direct'],
        monkeyClimbs,
      ),
      face(
        'monkey-northwest',
        'Northwest face',
        'NW',
        ['mp-monkey-right'],
        monkeyClimbs,
      ),
      face(
        'monkey-northeast',
        'Northeast face',
        'NE',
        ['mp-monkey-ne'],
        monkeyClimbs,
      ),
    ],
  },
]
