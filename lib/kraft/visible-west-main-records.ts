export type Corridor = {
  mpRouteId: string
  path: string
  entry: { x: number; y: number }
  region: string
  finish: string
  finishEvidence?: {
    photoId: string
    fact: string
    startFact?: string
  }
}
export type VisibleFace = {
  mpParentId: string
  faceId: string
  name: string
  orientation: 'unknown' | 'south' | 'east' | 'north'
  assetId: string
  alt: string
  photoIds: readonly [string, string, ...string[]]
  corridors: Corridor[]
}

export const visibleWestMainFaces: VisibleFace[] = [
  {
    mpParentId: '114000100',
    faceId: 'mtn-visible-sorange-main',
    name: 'Sorange main face',
    orientation: 'unknown',
    assetId: 'sorange-southeast-visible-guide',
    alt: 'Original reconstruction of Sorange’s broad sloping sandstone panel, oblique rib, raised crown and right edge.',
    photoIds: ['120119406', '116534421'],
    corridors: [
      {
        mpRouteId: '114000113',
        path: 'M1030 820 C1040 710 1130 625 1110 530 C1120 405 1190 290 1220 160',
        entry: { x: 1030, y: 820 },
        region:
          'Main southeast panel, following the broad edge/rail region toward its upper lip.',
        finish: 'Upper lip of the main southeast panel.',
        finishEvidence: {
          photoId: '116534421',
          fact: 'The named Sorange line in the source photograph reaches the upper southeast lip.',
        },
      },
      {
        mpRouteId: '114126089',
        path: 'M1030 820 C1100 785 1210 720 1280 610 C1300 500 1310 330 1300 190',
        entry: { x: 1030, y: 820 },
        region:
          'Same general entry as Sorange, traversing right across the panel’s rail region.',
        finish: 'Right-hand rim after the documented rightward traverse.',
      },
      {
        mpRouteId: '120119519',
        path: 'M1300 750 C1325 620 1330 490 1335 370 C1340 250 1335 170 1300 125',
        entry: { x: 1300, y: 750 },
        region:
          'The main block’s right outer arete, separate from the central southeast line.',
        finish:
          'Specific finish not documented; retain face membership without drawing this candidate.',
      },
    ],
  },
  {
    mpParentId: '114200315',
    faceId: 'mtn-visible-venom-prow',
    name: 'Venom prow and adjacent face',
    orientation: 'unknown',
    assetId: 'venom-prow-visible-guide',
    alt: 'Original reconstruction of Venom’s layered crown, overhanging left plane and rounded prow above a narrow foot.',
    photoIds: ['116355905', '116572811'],
    corridors: [
      {
        mpRouteId: '120119454',
        path: 'M300 900 C265 780 250 640 260 490 C265 350 275 250 300 180',
        entry: { x: 300, y: 900 },
        region:
          'Shallow left-plane dihedral immediately left of Spittin’ Venom.',
        finish:
          'Specific finish not documented or identified by the inspected named photo references.',
      },
      {
        mpRouteId: '114200319',
        path: 'M400 900 C360 770 350 620 370 460 C395 330 415 220 430 115',
        entry: { x: 400, y: 900 },
        region:
          'Overhanging left side of the principal prow, through the lower powerful region.',
        finish: 'Prow’s upper left rim reached by the documented topout.',
      },
      {
        mpRouteId: '116355888',
        path: 'M685 945 C695 820 745 700 735 630 C660 535 580 445 550 330 C535 250 500 155 480 100',
        entry: { x: 685, y: 945 },
        region:
          'Right of Spittin’ Venom, crossing the lower crimp region back to the prow.',
        finish: 'Upper prow after the documented crimp-to-arete sequence.',
      },
      {
        mpRouteId: '120119572',
        path: 'M830 610 C815 515 790 400 770 280 C755 215 748 155 740 110',
        entry: { x: 830, y: 610 },
        region:
          'Standing entry immediately right of Poison Control, ascending the adjacent face.',
        finish:
          'Specific finish not documented or identified by the inspected named photo references.',
      },
    ],
  },
  {
    mpParentId: '107430991',
    faceId: 'mp-face-107430991-south',
    name: 'Super Scream south face',
    orientation: 'south',
    assetId: 'super-scream-south-visible-guide',
    alt: 'Original reconstruction of Super Scream’s south face, with lower left section, central cleft, pocketed main plane and right arete.',
    photoIds: ['107432472', '117899833'],
    corridors: [
      {
        mpRouteId: '107431022',
        path: 'M315 825 C305 720 298 605 315 470 C335 365 345 300 355 240',
        entry: { x: 315, y: 825 },
        region: 'The arete immediately left of the south-face crack.',
        finish: 'Lower left section’s rim above its direct arete.',
        finishEvidence: {
          photoId: '107432472',
          fact: 'The named Front Left line in the south-face source photograph terminates at the upper rim of the lower left section.',
        },
      },
      {
        mpRouteId: '107431035',
        path: 'M470 860 C455 750 435 650 420 515 C420 395 445 280 470 200',
        entry: { x: 470, y: 860 },
        region:
          'The central open cleft separating the lower left section from the taller main plane.',
        finish: 'Upper end of the central south-face crack.',
        finishEvidence: {
          photoId: '107432472',
          fact: 'The named Crack line in the south-face source photograph terminates where the central cleft meets the upper rim of the left section.',
        },
      },
      {
        mpRouteId: '107430996',
        path: 'M825 835 C810 720 805 615 825 495 C845 360 865 210 870 55',
        entry: { x: 825, y: 835 },
        region:
          'Middle of the south face, between the central crack and the right arete.',
        finish: 'Main south-face crown above the central slot/sidepull region.',
        finishEvidence: {
          photoId: '107432472',
          fact: 'The named Front Center line in the south-face source photograph reaches the main upper rim.',
          startFact:
            'The named Front Center line is shown entering from the lower central south face; individual starting hands and posture are not specified.',
        },
      },
      {
        mpRouteId: '107431004',
        path: 'M1240 800 C1270 670 1290 535 1290 390 C1285 245 1270 145 1245 65',
        entry: { x: 1240, y: 800 },
        region: 'Right outer arete of the south-facing main block.',
        finish: 'Crown at the upper end of the right arete.',
        finishEvidence: {
          photoId: '107432472',
          fact: 'The named Right Arete line in the south-face source photograph reaches the upper right crown.',
        },
      },
    ],
  },
]
