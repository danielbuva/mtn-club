import { completeCatalog } from './catalog-records.ts'
import { cubeCatalog } from './cube-catalog.ts'
import { cubeRouteFacts } from './cube-route-facts.ts'
import { applyGradeComparisons } from './grade-comparisons.ts'
import { monkeyCatalog } from './monkey-catalog.ts'
import { monkeyRouteFacts } from './monkey-route-facts.ts'
import { pearlCatalog } from './pearl-catalog.ts'
import { pearlRouteFacts } from './pearl-route-facts.ts'
import { splitCatalog } from './split-catalog.ts'
import { splitRouteFacts } from './split-route-facts.ts'
import type { Climb } from './types'

const geometryGap =
  'Route lines require a licensed face photograph and local review.'

type ClimbInput = Pick<
  Climb,
  'id' | 'name' | 'grade' | 'gradeValue' | 'description' | 'faceIds'
> & {
  sourceId: string
  risk?: string
  aliases?: Climb['aliases']
}

function climb(input: ClimbInput): Climb {
  const { sourceId, ...details } = input
  return {
    ...details,
    status: 'source-observation',
    betaStatus: 'source-synopsis',
    boulderAssignmentStatus: 'source-backed',
    faceAssignmentStatus: !input.faceIds.length
      ? 'unassigned'
      : input.faceIds.includes('monkey-cave')
        ? 'editorial-provisional'
        : 'source-backed',
    sourceIds: [sourceId],
    selectedGradeSourceId: sourceId,
    gradeObservations: [
      {
        grade: input.grade,
        system: 'V',
        sourceId,
        status: 'source-observation',
        identityStatus: 'source-linked',
        sourceName: input.name,
      },
    ],
    geometry: input.faceIds.map(faceId => ({
      status: 'missing',
      faceId,
      reason: geometryGap,
    })),
  }
}

const studiedCubeClimbs = [
  climb({
    id: 'west-face-left',
    name: 'West Face Left',
    grade: 'V0',
    gradeValue: 0,
    sourceId: 'mp-west-face-left',
    description:
      'West face, toward its north edge. The source also identifies this line as a descent option.',
    faceIds: ['cube-west'],
    risk: 'PG13 · highball',
  }),
  climb({
    id: 'perfect-poser',
    name: 'Perfect Poser',
    grade: 'V1',
    gradeValue: 1,
    sourceId: 'mp-perfect-poser',
    description:
      'North-face highball identified as a descent by the Total Devastation page and Cube parent. Starting holds and exact line still need review.',
    faceIds: ['cube-north'],
    risk: 'R · highball',
  }),
  climb({
    id: 'fear-of-a-black-hat',
    name: 'Fear of a Black Hat',
    grade: 'V9',
    gradeValue: 9,
    sourceId: 'mp-black-hat',
    description: 'Crouching start to the overhanging arête on the south side.',
    faceIds: ['cube-south'],
    risk: 'PG13 · highball',
  }),
]

const studiedSplitClimbs = [
  climb({
    id: 'front-side-crack',
    name: 'Front Side Crack',
    grade: 'V0',
    gradeValue: 0,
    sourceId: 'mp-front-crack',
    description:
      'The chimney on the north, uphill side. The source also lists a 5.8 YDS grade.',
    faceIds: ['split-north'],
    risk: 'R · highball',
  }),
  climb({
    id: 'plumbers-crack',
    name: "Plumber's Crack",
    grade: 'V2',
    gradeValue: 2,
    sourceId: 'mp-plumbers',
    description:
      'The offwidth crack on the south, downhill side. The source also lists 5.9 YDS.',
    faceIds: ['split-south'],
    risk: 'R · highball',
  }),
  climb({
    id: 'split-decision',
    name: 'Split Decision',
    grade: 'V1',
    gradeValue: 1,
    sourceId: 'mp-split-decision',
    description:
      "Crimp line roughly 5–10 feet right of Plumber's Crack. The source reports a landing over uneven, jumbled rocks; face assignment awaits review.",
    faceIds: [],
    risk: 'Uneven landing · jumbled rocks (source observation)',
  }),
]

const studiedPearlClimbs = [
  climb({
    id: 'the-pearl',
    name: 'The Pearl',
    grade: 'V5',
    gradeValue: 5,
    sourceId: 'mp-pearl-route',
    description:
      'Pocket-and-crimp start on the southeast face. Descent is described on the opposite side.',
    faceIds: ['pearl-southeast'],
  }),
  climb({
    id: 'northeast-face-center',
    name: 'Northeast Face Center',
    grade: 'V1',
    gradeValue: 1,
    sourceId: 'mp-pearl-ne',
    description:
      'Central line of the northeast face, with sharp positive holds.',
    faceIds: ['pearl-northeast'],
  }),
  climb({
    id: 'six-pack',
    name: 'Six Pack',
    grade: 'V0',
    gradeValue: 0,
    sourceId: 'mp-six-pack',
    description:
      'A north-side line. The exact face assignment needs local confirmation.',
    faceIds: [],
  }),
  climb({
    id: 'jennas-jewelry',
    name: "Jenna's Jewelry",
    grade: 'V3–4',
    gradeValue: 3,
    sourceId: 'mp-jennas',
    description:
      'A ledge-to-lip problem around the corner to the right of The Pearl. Face assignment awaits review.',
    faceIds: [],
  }),
]

const studiedMonkeyClimbs = [
  climb({
    id: 'monkey-bars',
    name: 'Monkey Bars',
    grade: 'V2',
    gradeValue: 2,
    sourceId: 'mp-monkey-bars',
    description:
      'Sit start on the left of the cave, traverse right, then climb out at the arête. The wrap onto the upper face needs a reviewed second view.',
    faceIds: ['monkey-cave'],
  }),
  climb({
    id: 'hyperglide',
    name: 'Hyperglide',
    grade: 'V5',
    gradeValue: 5,
    sourceId: 'mp-hyperglide',
    aliases: [
      {
        name: 'Monkey Pinch',
        sourceId: 'mp-hyperglide',
        identityStatus: 'source-linked',
        note: 'The MP route prose explicitly records this earlier name.',
      },
    ],
    description:
      'Shares the Monkey Bars starting area, then exits up and left from the cave.',
    faceIds: ['monkey-cave'],
  }),
  climb({
    id: 'monkey-bar-direct',
    name: 'Monkey Bar Direct',
    grade: 'V8',
    gradeValue: 8,
    sourceId: 'mp-monkey-direct',
    description:
      'Uphill roof line from the low jug through paired pockets. Cardinal face assignment remains unconfirmed.',
    faceIds: ['monkey-cave'],
  }),
  climb({
    id: 'monkey-bar-right',
    name: 'Monkey Bar Right',
    grade: 'V6',
    gradeValue: 6,
    sourceId: 'mp-monkey-right',
    description:
      'Sit start on the northwest side; the line trends up and left after a large sidepull.',
    faceIds: ['monkey-northwest'],
  }),
  climb({
    id: 'monkey-northeast-left',
    name: 'Northeast Face Left',
    grade: 'V3',
    gradeValue: 3,
    sourceId: 'mp-monkey-ne',
    description:
      'Sit start on the left of the northeast face, then climb through crimps to the break.',
    faceIds: ['monkey-northeast'],
  }),
]

applyGradeComparisons([
  ...studiedCubeClimbs,
  ...studiedSplitClimbs,
  ...studiedPearlClimbs,
  ...studiedMonkeyClimbs,
])

export const cubeClimbs = completeCatalog(
  studiedCubeClimbs,
  cubeCatalog,
  'mp-cube',
  cubeRouteFacts,
)
export const splitClimbs = completeCatalog(
  studiedSplitClimbs,
  splitCatalog,
  'mp-split',
  splitRouteFacts,
)
export const pearlClimbs = completeCatalog(
  studiedPearlClimbs,
  pearlCatalog,
  'mp-pearl',
  pearlRouteFacts,
)
export const monkeyClimbs = completeCatalog(
  studiedMonkeyClimbs,
  monkeyCatalog,
  'mp-monkey',
  monkeyRouteFacts,
)
