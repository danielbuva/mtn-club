import type { RouteFacts } from './route-facts'

export const cubeRouteFacts: Record<string, RouteFacts> = {
  'perfect-poser': {
    description:
      'North-face highball identified as a descent by the Total Devastation page and Cube parent. Starting holds and exact line still need review.',
    sourceIds: ['mp-route-111470042', 'mp-cube'],
    faceIds: ['cube-north'],
  },
  'cube-a-clockwork-orange': {
    description:
      'South-side highball that shares the Fear of a Black Hat start, then follows pockets and edges through steep patina.',
    faceIds: ['cube-south'],
  },
  'cube-big-love': {
    description:
      'Standing start on the face to the right of Perfect Poser. Small edges lead to a long middle reach and a straight finish.',
  },
  'cube-full-regulation': {
    description:
      'Uses the Total Devastation starting rail, then takes its direct finish through a flake and pocket. The difficult topout is high above the ground.',
  },
  'cube-marriage': {
    description:
      'East-face standing start left of the right arête. Sustained edge climbing ends in a high, reach-dependent crux; the source recommends top-rope rehearsal.',
    gradeObservations: [
      {
        grade: 'V5',
        system: 'V',
        sourceId: 'mp-route-124045669',
        sourceName: 'Marriage',
        status: 'source-observation',
        identityStatus: 'unresolved',
        note: 'MP route prose reports a guidebook V5. The original guidebook page and exact line comparison were not reviewed.',
      },
    ],
    disagreement:
      'The selected parent table lists V6+. MP route prose reports a guidebook V5; that original page and exact line identity are unresolved. No reconciliation is inferred.',
  },
  'cube-marriage-sit': {
    description:
      'Lower seated entry into Marriage on the east face, adding a crimp sequence before its standing start and high finishing crux.',
  },
  'cube-martinets-rails': {
    description:
      'A tall ledge system around the corner left of Fear of a Black Hat. The crux is low; the source describes this line as a descent option.',
  },
  'cube-total-devastation': {
    description:
      'Left side of the east face, with a standing rail start and a rightward middle crux. Its high finish trends left. The source names Perfect Poser on the north face as a descent.',
  },
  'cube-total-devastation-direct': {
    description:
      'Standing crimp entry below the Total Devastation rail, joining that line from the right. The initial difficulty is lower, followed by a high topout.',
  },
  'cube-total-devastation-left': {
    description:
      'East-face variation from the Total Devastation starting rail. It takes a leftward sequence through sidepulls and patina before joining that problem’s finish.',
  },
}
