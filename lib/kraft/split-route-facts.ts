import type { RouteFacts } from './route-facts'

export const splitRouteFacts: Record<string, RouteFacts> = {
  'split-leaning-wide-crack': {
    description:
      'A north-facing, left-leaning wide crack on a rock north of Plumber’s Crack. The source distinguishes crack technique from a lower-grade layback alternative.',
    boulderAssignmentNote:
      'The Split parent table lists this route, but the route page places it on a separate boulder to the north. Physical boulder identity and coordinates are unresolved; no Split face assignment is asserted.',
  },
  'split-the-mole': {
    description:
      'Uphill side near the descent, with a seated crimp start left of a vertical seam. The line moves right into the seam for its finish.',
    faceIds: ['split-north'],
    sourceIds: ['thetopo-split', 'mp-route-107974947'],
    gradeObservations: [
      {
        grade: '7A',
        system: 'Font',
        sourceId: 'thetopo-split',
        sourceName: 'The Mole',
        status: 'source-observation',
        identityStatus: 'unresolved',
        note: 'Same-name entry on the candidate Split boulder; exact physical line and current condition are unresolved.',
      },
      {
        grade: 'V5/6',
        system: 'V',
        sourceId: 'mp-route-107974947',
        sourceName: 'The Mole',
        status: 'source-observation',
        identityStatus: 'unresolved',
        note: 'Neighbor reference in Phazed’s route prose. Exact line identity and grade history were not independently reviewed.',
      },
    ],
    conditionObservations: [
      {
        condition:
          'Reported break with no subsequent ascent stated by publisher',
        sourceId: 'thetopo-split',
        sourceName: 'The Mole',
        status: 'source-observation',
        identityStatus: 'unresolved',
        note: 'Undated same-name note on a candidate boulder. It does not establish that the selected MP line is currently broken or unclimbed.',
      },
    ],
    disagreement:
      'MP’s parent table lists V7 / Font 7A+. The candidate theTopo same-name entry lists Font 7A and an undated broken-condition report; Phazed’s neighboring-route prose uses V5/6. Exact physical line, condition and grade history remain unresolved.',
  },
  'split-phazed-aka-the-hole': {
    description:
      'Seated edge problem just right of The Mole on the back of the boulder. A substantial hole beneath the climb is an explicit landing concern in the source.',
  },
  'split-plumbers-crack-traverse': {
    description:
      'Traverse from the arête formed by Plumber’s Crack toward the right, finishing on Split Decision. The photographed view and continuation need review.',
  },
  'split-slice-n-dice': {
    description:
      'Uphill-side variation with opposing sidepulls, a pinch crux and a rightward finish into highball terrain. It shares a crux with the separately named Plunger.',
    faceIds: ['split-north'],
  },
  'split-split-decision-sit': {
    description:
      'Seated crimp entry joining Split Decision’s standing start, to the right of Plumber’s Crack near Slice N Dice. Its exact photo-view assignment remains pending.',
  },
}
