import type { SourceViewGroup } from './source-view-types'

// Primary route facts only. The area/photo north label is not inherited by
// Potato's relative routes, and Warm-up's named relations do not inherit south.
export const mainSourceViewGroups: SourceViewGroup[] = [
  {
    mpParentId: '105959400',
    key: 'potato-chips-relative-region',
    orientation: 'unknown',
    assignmentStatus: 'editorial-provisional',
    routes: {
      '106650925': {
        factField: 'path',
        sourceFact:
          'Follow the flake with heel hooks toward the central high point.',
      },
      '106650919': 'Overhanging line right of center.',
      '113679909': 'Immediately left of Potato Chips.',
      '116680131': {
        factField: 'start',
        sourceFact:
          'Begin a couple feet left of Potato Chips with a small right crimp and a left crimp or undercling.',
      },
      '114236573': {
        factField: 'path',
        sourceFact:
          'Adds one or two crimp moves to the regular Potato Chips line.',
      },
      '106650933': {
        factField: 'path',
        sourceFact:
          'Traverse the full rail as a continuation of the traverse problem.',
      },
      '108439752': {
        factField: 'finish',
        sourceFact: 'Use the Poker Chips top-out.',
      },
      '118057327': {
        factField: 'path',
        sourceFact: 'Reach the flake jugs that start Right Lip Traverse.',
      },
    },
    relations: [
      {
        mpRouteId: '106650919',
        factField: 'face',
        sourceFact: 'Overhanging line right of center.',
      },
      {
        mpRouteId: '106650925',
        factField: 'path',
        sourceFact:
          'Follow the flake with heel hooks toward the central high point.',
      },
      {
        mpRouteId: '108439752',
        factField: 'finish',
        sourceFact: 'Use the Poker Chips top-out.',
      },
      {
        mpRouteId: '106650933',
        factField: 'finish',
        sourceFact: 'Continue until a step-off is possible on the other side.',
      },
    ],
  },
  {
    mpParentId: '106657477',
    key: 'main-south',
    orientation: 'south',
    routes: {
      '106657480': 'Main boulder’s south side, left of center.',
    },
    relations: [],
  },
  {
    mpParentId: '106657477',
    key: 'main-southwest',
    orientation: 'southwest',
    routes: {
      '107430241': 'Southwest side, far-left portion of the wall.',
      '107396283':
        'Southwest face of the main Warmup Boulder, right of Fluffer.',
    },
    relations: [],
  },
  {
    mpParentId: '106657477',
    key: 'fluffer-donkey-relative-region',
    orientation: 'unknown',
    assignmentStatus: 'editorial-provisional',
    routes: {
      '107116919': 'Right of Fluffer on the main warm-up boulder.',
      '107432448': {
        factField: 'approach',
        sourceFact: 'Immediately right of the original Donkey Punch.',
      },
      '122054608': {
        factField: 'start',
        sourceFact: 'Same as Fluffer.',
      },
      '125574115': {
        factField: 'start',
        sourceFact: 'Use the sidepull crimp right of Fluffer.',
      },
    },
    relations: [
      {
        mpRouteId: '106657480',
        factField: 'face',
        sourceFact: 'Main boulder’s south side, left of center.',
      },
      {
        mpRouteId: '107396283',
        factField: 'face',
        sourceFact:
          'Southwest face of the main Warmup Boulder, right of Fluffer.',
      },
    ],
  },
]
