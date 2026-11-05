import type { VisibleFace } from './visible-west-main-records'

export const visibleExistingCorridorFaces: VisibleFace[] = [
  {
    mpParentId: '106657477',
    faceId: 'mp-view-106657477-main-southwest',
    name: 'Main south / southwest plane',
    orientation: 'unknown',
    assetId: 'warm-main-southwest-guide',
    alt: 'Original reconstruction of Warm-up Main’s broad plane and oblique lower break.',
    photoIds: ['107432433', '107409011'],
    corridors: [
      {
        mpRouteId: '107396283',
        entry: { x: 675, y: 800 },
        path: 'M675 800 C750 710 840 630 875 560 C855 510 830 470 830 425',
        region:
          'Undercling-rail region, reaching right and then slightly left above the lower break.',
        finish:
          'Documented upper pinch region; an approximate corridor rather than calibrated hand holds.',
      },
    ],
  },
  {
    mpParentId: '105959392',
    faceId: 'split-north-chimney',
    name: 'Split north chimney',
    orientation: 'north',
    assetId: 'split-north-chimney-guide',
    alt: 'Original reconstruction of Split’s open north chimney and front base block.',
    photoIds: ['112791386', '111794980'],
    corridors: [
      {
        mpRouteId: '106617793',
        entry: { x: 570, y: 955 },
        path: 'M570 955 C575 835 570 710 565 580 C565 440 560 300 550 180',
        region:
          'Open chimney between the left slab and broad right wall, from the ground opening upward.',
        finish:
          'Crack-top region where the primary description reports a bolt hanger, without identifying an exact hand hold.',
        finishEvidence: {
          photoId: '112791386',
          startFact:
            'The named north-chimney photograph shows the crack opening at ground level behind the front base block. This identifies a general entry region; no starting-hand constraint is stated.',
          fact: 'The primary route description reports a bolt hanger at the crack’s top; the north-chimney photograph identifies that upper crack region. Exact exiting moves and current hardware condition remain unverified.',
        },
      },
    ],
  },
]
