import type { RouteFacts } from './route-facts'

export const monkeyRouteFacts: Record<string, RouteFacts> = {
  'monkey-bar-direct': {
    description:
      'Uphill roof line from a low jug through paired pockets and edges to an easier topout. The source describes alternate left/right finishes and greater reach difficulty for shorter climbers; their exact lines need photographic review.',
    sourceIds: ['mp-monkey-direct-scott-2023', 'mp-monkey-direct-radke-2024'],
    gradeObservations: [
      {
        grade: 'V10',
        system: 'V',
        sourceId: 'mp-monkey-direct-scott-2023',
        sourceName: 'Monkey Bar Direct',
        status: 'source-observation',
        identityStatus: 'source-linked',
        reportedAt: '2023-04-21',
        note: 'Scott B’s dated route comment proposes approximately V10 after a reported break. This is a personal opinion; current condition and consensus grade are not established.',
      },
      {
        grade: 'V8',
        system: 'V',
        sourceId: 'mp-monkey-direct-radke-2024',
        sourceName: 'Monkey Bar Direct',
        status: 'source-observation',
        identityStatus: 'source-linked',
        reportedAt: '2024-03-28',
        note: 'Zachary Radke’s dated route comment says the problem remains V8 after the reported break. This is a personal opinion; current condition and consensus grade are not established.',
      },
    ],
    conditionObservations: [
      {
        condition: 'Reported post-break climbing',
        sourceId: 'mp-monkey-direct-scott-2023',
        sourceName: 'Monkey Bar Direct',
        status: 'source-observation',
        identityStatus: 'source-linked',
        reportedAt: '2023-04-21',
        note: 'Scott B’s April 21, 2023 comment links post-break beta and proposes a harder grade. The comment does not establish the break date, affected hold or present condition.',
      },
      {
        condition: 'Reported post-break climbing with unchanged-grade opinion',
        sourceId: 'mp-monkey-direct-radke-2024',
        sourceName: 'Monkey Bar Direct',
        status: 'source-observation',
        identityStatus: 'source-linked',
        reportedAt: '2024-03-28',
        note: 'Zachary Radke’s March 28, 2024 comment discusses the break while retaining a V8 opinion. The present condition and effect remain unreviewed.',
      },
    ],
    disagreement:
      'The selected Mountain Project table remains V8 / Font 7B. Scott B’s April 21, 2023 post-break comment proposes about V10; Zachary Radke’s March 28, 2024 comment retains V8. These dated opinions do not establish current condition or consensus. theTopo’s same-name Font 7B+ comparison also has unresolved physical line identity.',
  },
  'monkey-blunt-arete': {
    description:
      'Seated start on the blunt arête right of Monkey Crack, using incut edges and feet in a large hueco before the easier finish.',
  },
  'monkey-center-face': {
    description:
      'Seated start on a left-facing flake between Monkey Crack and the seam problem. Cardinal view assignment is not stated.',
  },
  'monkey-curious-george': {
    description:
      'Seated sidepull start at a back corner left of Hyperglide, with an early long move to a flat hold. The source does not resolve its photo view.',
  },
  'monkey-darwin-award': {
    description:
      'West-side shelter traverse from a seated start, including an inverted crack section and a finish on the leaning slab. Continuing onto Monkey Bar Boulder is optional. The source notes multiple variants; their identities remain separate.',
    boulderAssignmentNote:
      'The Monkey parent table lists this route, but the main line finishes on a separate slab that creates the shelter. Continuing onto Monkey Bar Boulder is optional; exact physical rock/face membership needs review.',
  },
  'monkey-glory-hole': {
    description:
      'Tunnel line near Darwin Award’s inverted section, finishing through a hole in the leaning-rock shelter. A standing entry and a Darwin Award entry are described.',
    boulderAssignmentNote:
      'The Monkey parent table lists this route, but the route involves a tunnel formed by a separate slab leaning against Monkey Bar Boulder. The exact physical rock/face membership needs review; no face or separate coordinate is invented.',
  },
  'monkey-left': {
    description:
      'Standing crimp start below a weakness near Left Left. The page’s description and location disagree on whether it lies left or right of Left Left; that relationship remains unresolved.',
  },
  'monkey-left-left': {
    description:
      'Undercling-slot start on the arête left of Monkey Crack, following a weakness upward and right. Its exact photographic view remains pending.',
  },
  'monkey-monkey-bar-direct-right': {
    description:
      'Northwest-side seated start from a low rail, moving through pockets into a direct finish. Its Classic Monkey starting area is source-linked to Monkey Bar Right by Monkey’s Uncle; exact hold/photo correspondence still needs review.',
    faceIds: ['monkey-northwest'],
    sourceIds: ['mp-route-123281460'],
  },
  'monkey-monkey-bar-traverse': {
    description:
      'Linkup from Monkey Bars into Monkey Bar Direct, using a lower traverse between them. The source describes descent on the northwest side to smaller rocks; the wrap needs reviewed views.',
  },
  'monkey-monkey-crack': {
    description:
      'Trailside crack with nearby face holds on the southeast side. This does not establish a northeast-view assignment.',
  },
  'monkey-monkey-far': {
    description:
      'Seated linkup through Classic Monkey to its jug rail, then a long dynamic move to a separate jug finish. Monkey’s Uncle explicitly equates Classic Monkey with Monkey Bar Right; exact hold/photo correspondence still needs review.',
    sourceIds: ['mp-route-123281460'],
  },
  'monkey-monkey-near': {
    description:
      'Shares Monkey Far’s initial sequence, replacing its dynamic jump with a rightward edge-and-slot exit to jugs.',
  },
  'monkey-monkeys-uncle': {
    description:
      'Seated linkup from Monkey Bar Right through a reverse Monkey Bar Traverse, finishing on Hyperglide. It spans named lines and requires reviewed views before continuation geometry is authored.',
  },
  'monkey-peter-north-pump': {
    description:
      'Linkup beginning on Northeast Face Left, traversing around the rock into Monkey Bar Direct and finishing that line. Other named finishing variants are not merged with this record.',
  },
  'monkey-pockets': {
    description:
      'Pocket-based seated start with face climbing above. The source gives no cardinal face or photo-view identity.',
  },
  'monkey-prow-direct': {
    description:
      'Jug start beneath the prow, right of the juggy overhang, climbing directly into edges and then better holds. The source places it before the Monkey Bar Traverse entry.',
  },
  'monkey-the-redirect': {
    description:
      'Shares the Monkey Bar Direct start, then crosses left to the end of Monkey Bars. The source identifies an eliminate; its hold rules and photographed extent require review.',
  },
  'monkey-right-of-crack': {
    description:
      'Seated crimp line between Monkey Crack and Center Face, reaching better finishing holds. No cardinal face is specified.',
  },
  'monkey-the-rising-sun': {
    description:
      'Traversing linkup from Monkey Crack toward the right along rails, finishing as Curious George. The route’s full view and continuation remain unassigned.',
  },
  'monkey-seam': {
    description:
      'Edge start on both sides of a seam between Center Face and Curious George, followed by a patina finish. Starting-hold reach varies; the source mentions pad stacking.',
  },
  'monkey-umpa-lumpa': {
    description:
      'Lowball on a small standalone rock west of Monkey Bar Boulder’s west face. The source gives no detailed movement or starting holds.',
    boulderAssignmentNote:
      'The Monkey parent table lists this route, but its route page identifies a separate small boulder west of Monkey Bar Boulder. Physical boulder identity and coordinates are unresolved; the route is retained only as a source-catalog association.',
  },
  'monkey-bar-right': {
    description:
      'Sit start on the northwest side; the line trends up and left after a large sidepull.',
    sourceIds: ['mp-route-123281460'],
    aliases: [
      {
        name: 'Classic Monkey',
        sourceId: 'mp-route-123281460',
        identityStatus: 'source-linked',
        note: 'The Monkey’s Uncle route page explicitly identifies Classic Monkey as Monkey Bar Right.',
      },
    ],
  },
}
