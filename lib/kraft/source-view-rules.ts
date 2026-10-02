import type { RouteFactFields } from './catalog-types'
import type { SourceFaceOrientation } from './source-face-types'

export type SourceViewFactRule = {
  mpRouteId: string
  factField: keyof RouteFactFields
  sourceFact: string
}

type SourceViewGroup = {
  mpParentId: string
  key: string
  orientation: SourceFaceOrientation | 'unknown'
  routes: Record<string, string | Omit<SourceViewFactRule, 'mpRouteId'>>
  relations: SourceViewFactRule[]
  faceId?: string
  assignmentStatus?: 'source-backed' | 'editorial-provisional'
}

function view(
  mpParentId: string,
  key: string,
  orientation: SourceViewGroup['orientation'],
  routes: SourceViewGroup['routes'],
  relations: SourceViewFactRule[] = [],
  faceId?: string,
): SourceViewGroup {
  return { mpParentId, key, orientation, routes, relations, faceId }
}

// Exact stored primary-MP facts, including qualified corners and catalog views.
// Relative groups have named same-parent evidence, never inherited compass labels.
export const sourceViewGroups: SourceViewGroup[] = [
  view(
    '105959355',
    'east',
    'east',
    {
      '124045669':
        'East face, reported roughly seven feet left of the right arête.',
      '124045709':
        'East face, reported roughly seven feet left of the right arête.',
      '111470042': 'East face, leftmost line.',
      '124045533': 'East face, left portion.',
      '121616668':
        "Face below Total Devastation's jug rail, right of that route.",
      '116693657': {
        factField: 'path',
        sourceFact:
          "Climb to Total Devastation's mantel, then continue straight above through a hollow flake and pocket.",
      },
    },
    [
      {
        mpRouteId: '111470042',
        factField: 'face',
        sourceFact: 'East face, leftmost line.',
      },
    ],
    'cube-east',
  ),
  view('105937674', 'southeast-crack', 'southeast', {
    '107849034':
      'Southeast side of Monkey Bar Boulder, directly beside the trail.',
  }),
  {
    ...view(
      '105937674',
      'monkey-crack-relative-region',
      'unknown',
      {
        '114126068':
          'Blunt arête right of Monkey Crack; relative placement only.',
        '108731189':
          'Between Monkey Crack on the left and the V2 seam on the right; relative placement only.',
        '114126042': 'Arête left of Monkey Crack; relative placement only.',
        '108731202':
          'Right of Monkey Crack and left of Center Face; relative placement only.',
        '121742287':
          'Seam between Curious George on the right and Center Face on the left; relative placement only.',
      },
      [
        {
          mpRouteId: '107849034',
          factField: 'face',
          sourceFact:
            'Southeast side of Monkey Bar Boulder, directly beside the trail.',
        },
        {
          mpRouteId: '108731189',
          factField: 'face',
          sourceFact:
            'Between Monkey Crack on the left and the V2 seam on the right; relative placement only.',
        },
      ],
    ),
    assignmentStatus: 'editorial-provisional',
  },
  view('123856651', 'rear', 'unknown', {
    '125073927': 'Backside of Black Warmup Boulder North.',
    '107430220': 'Backside of the more northern boulder.',
    '107430226': 'Backside of the northern boulder.',
    '112868532': 'Right arete at the back of the boulder.',
    '125074020': 'Backside of North Black Warm-up Boulder.',
    '113801775': 'North/back side of the second, right black warm-up boulder.',
  }),
  view('123856648', 'fin-rear', 'unknown', {
    '107430198': 'Backside wall of the fin boulder.',
    '107430210': 'Backside of the fin boulder.',
    '107430204': 'Left arete of the rear wall.',
  }),
  view('123856648', 'fin-front-edge', 'unknown', {
    '107430182': 'At the fin’s front edge on the face’s right side.',
  }),
  view('119981199', 'south-arete', 'south', {
    '119981210': 'South arête.',
  }),
  view('118341819', 'northeast-corner', 'northeast', {
    '125195801': 'Northeast corner.',
  }),
  view('114200315', 'south-corner-arete', 'south', {
    '120119682': 'South corner arête.',
  }),
  view('110174546', 'east-groove', 'east', {
    '110174761': 'East/right side.',
  }),
  view('110174546', 'easternmost-arete', 'east', {
    '110174781':
      "Easternmost/right line; arête right of The Groove's dihedral.",
  }),
  view('110174546', 'south-arete', 'south', {
    '110174755': 'South arête.',
  }),
  view('110174546', 'far-west-edge', 'west', {
    '110174619': 'Far-west edge; leftmost when viewing the front.',
  }),
  view('106799341', 'southeast-roof-corner', 'southeast', {
    '106799344': 'Southeast corner beneath a roof.',
  }),
  view('120588274', 'south-corner', 'south', {
    '125499203': 'South corner.',
    '120588286': 'South-corner lip/arête.',
  }),
  view('120588274', 'northwest-corner', 'northwest', {
    '120588308': 'Northwest corner.',
    '120588296': 'Northwest corner.',
    '200739087': 'Northwest corner.',
  }),
  view('107430930', 'northwest-corner', 'northwest', {
    '126830908': 'Northwest corner of Croupier.',
  }),
  view('110224264', 'south-arete', 'south', {
    '110224293': 'South arête and slab.',
  }),
  view('107430957', 'northwest-arete', 'northwest', {
    '107430960': 'Overhanging northwest arête.',
  }),
  view('125692223', 'northeast-arete', 'northeast', {
    '125692296':
      'Northeast arête immediately right of the main Swirly Arête line; slab feet.',
  }),
  view('113973264', 'west-rear-slab', 'west', {
    '200632114': 'Tall, low-angle west-facing rear slab.',
  }),
]
