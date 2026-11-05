import type { VisibleFace } from './visible-west-main-records'

export const visibleEastFaces: VisibleFace[] = [
  {
    mpParentId: '113802231',
    faceId: 'mtn-visible-wave-front',
    name: 'Wave shelf and prow',
    orientation: 'unknown',
    assetId: 'wave-front-visible-guide',
    alt: 'Original reconstruction of The Wave’s compact sandstone prow, raised roof and short right shelf.',
    photoIds: ['116581459', '113802236', '116581456'],
    corridors: [
      {
        mpRouteId: '120512326',
        entry: { x: 1210, y: 615 },
        path: 'M1210 615 C1170 590 1100 565 1010 520 C960 450 950 380 930 315',
        region:
          'Right shelf entry, moving left/up to the shelf end before the vertical exit.',
        finish:
          'Above the shelf end; approximate general exit, not a mapped hold.',
      },
      {
        mpRouteId: '200417113',
        entry: { x: 1250, y: 780 },
        path: 'M1250 780 C1240 690 1190 620 1110 580 C1060 550 1010 520 975 485 C955 420 945 360 930 315',
        region:
          'Lower right patina region, then left across the upper shelf to the Right Exit.',
        finish: 'Shares the source-described Right Exit dihedral exit.',
      },
      {
        mpRouteId: '113882435',
        entry: { x: 1210, y: 615 },
        path: 'M1210 615 C1100 655 985 695 850 730 C650 775 430 780 275 730 C225 615 225 500 240 390',
        region:
          'Shared right shelf, staying low beneath the projecting roof and moving left.',
        finish:
          'Left of the central bulge, as documented; the exact slot is unlocated.',
      },
      {
        mpRouteId: '115962906',
        entry: { x: 1210, y: 615 },
        path: 'M1210 615 C1190 560 1160 525 1130 470',
        region:
          'Vertical mantle from the shared right shelf entry; does not traverse across the face.',
        finish: 'Mantle over the shelf, without claiming the highest crown.',
        finishEvidence: {
          photoId: '116581456',
          fact: 'The Wave Direct route-linked photograph shows the climber mantling over the shelf for the top-out. This establishes the shelf exit, not a highest-crown finishing hold.',
        },
      },
      {
        mpRouteId: '123621594',
        entry: { x: 1245, y: 820 },
        path: 'M1245 820 C1240 740 1225 670 1210 615 C1190 560 1160 525 1130 470',
        region:
          'Lower seated sidepull region joining Wave Direct at the shelf.',
        finish: 'Documented shared Direct mantle exit.',
        finishEvidence: {
          photoId: '116581456',
          fact: 'The seated route explicitly joins Wave Direct and uses its finish; the named Direct photograph identifies the shelf mantle exit. No independent finishing sequence or hand holds are asserted.',
        },
      },
    ],
  },
  {
    mpParentId: '106657514',
    faceId: 'mtn-visible-alexisizer-east-traverse',
    name: 'Alexisizer east traverse',
    orientation: 'east',
    assetId: 'alexisizer-east-visible-guide',
    alt: 'Original reconstruction of Alexisizer’s upright varnished front plane, overhanging lip, low roof and steep right corner.',
    photoIds: ['108013972', '108303675', '107398166'],
    corridors: [
      {
        mpRouteId: '106657518',
        entry: { x: 260, y: 755 },
        path: 'M260 755 C460 720 640 700 825 700 C940 690 1020 680 1115 650 C1120 615 1120 585 1105 560',
        region: 'Left-to-right traverse along the broad overhanging east lip.',
        finish:
          'At the beginning of the large diagonal crack, below the crown.',
      },
      {
        mpRouteId: '106802785',
        entry: { x: 1190, y: 850 },
        path: 'M1190 850 C1210 790 1200 745 1170 720 C1150 700 1130 680 1115 650 C1120 615 1120 585 1105 560',
        region:
          'Low right corner entry, moving into the Alexisizer exit region.',
        finish:
          'Shared Alexisizer exit; individual sidepull/sloper holds remain unlocated.',
      },
      {
        mpRouteId: '124100350',
        entry: { x: 1190, y: 850 },
        path: 'M1190 850 C1210 790 1200 745 1170 720 C1060 700 950 690 825 700 C640 700 460 720 260 755 C250 700 255 650 285 600',
        region:
          'Timmy’s low right entry, then the reverse traverse toward the left.',
        finish: 'Mantle at Alexisizer’s original left starting end.',
      },
      {
        mpRouteId: '107383132',
        entry: { x: 710, y: 720 },
        path: 'M710 720 C705 680 700 640 695 600',
        region:
          'One documented central mantle interpretation; other source start choices remain available.',
        finish: 'Over the central lip, not an invented highest-crown finish.',
        finishEvidence: {
          photoId: '107398166',
          fact: 'The Mantel route-linked photograph shows a climber establishing the upper side of the central lip during the mantle. It does not establish an additional higher crown finish.',
        },
      },
    ],
  },
  {
    mpParentId: '106657496',
    faceId: 'mtn-visible-bills-trail-front',
    name: 'Bill’s trail-facing plane',
    orientation: 'unknown',
    assetId: 'bills-trail-front-visible-guide',
    alt: 'Original reconstruction of Bill’s layered trail-facing wall, central fracture and stacked right-hand ledges; separate roof and east planes are excluded.',
    photoIds: ['106688214', '200973093'],
    corridors: [
      {
        mpRouteId: '126761647',
        entry: { x: 485, y: 800 },
        path: 'M485 800 C460 690 435 610 420 500 C420 380 445 300 480 230',
        region:
          'Left of I Disagree, upward through the jug and blocky-corner region.',
        finish: 'Above the blocky-corner hold, as described.',
      },
      {
        mpRouteId: '106657499',
        entry: { x: 725, y: 850 },
        path: 'M725 850 C730 730 740 610 735 490 C730 380 725 275 715 170',
        region: 'Central trail-facing wall, vertical seated entry and ascent.',
        finish:
          'Upper rock region beneath the person identified by the named source caption; exact exit holds are not documented.',
        finishEvidence: {
          photoId: '106688214',
          fact: 'The I Disagree-linked photograph’s caption identifies the line directly below the person standing on the upper rock. It supports a general upper-rock terminal region, not individual exit holds.',
        },
      },
      {
        mpRouteId: '107408429',
        entry: { x: 195, y: 655 },
        path: 'M195 655 C165 550 160 460 175 370 C185 290 205 230 230 180',
        region:
          'Blunt outer arete left of I Disagree, with a jump entry and mantle.',
        finish:
          'Documented mantle over the left arete; no exact jump hold is plotted.',
      },
    ],
  },
]
