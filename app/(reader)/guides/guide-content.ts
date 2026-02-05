import { DISCORD_INVITE_URL, INSTAGRAM_URL } from '@/lib/constants'
import type { GuideSection } from './types'

export const startHereSections: GuideSection[] = [
  {
    id: 'welcome',
    title: 'Welcome to UNLV Mountain Club',
    blocks: [
      {
        kind: 'p',
        text: "A student-run outdoor club focused on climbing, camping, hiking, and backpacking. We climb together during the week and get outside on weekends. You don't need experience or gear - just interest.",
      },
    ],
  },
  {
    id: 'who-for',
    title: 'Who this is for',
    blocks: [
      {
        kind: 'list',
        items: [
          'Anyone curious about the outdoors',
          'Beginners who want to learn in a low-pressure environment',
          'Experienced folks looking for partners and logistics',
          "People who want to show up when they can and skip when they can't",
        ],
      },
    ],
  },
  {
    id: 'who-not',
    title: 'Who this is not for',
    blocks: [
      {
        kind: 'list',
        items: [
          'People looking for guided, commercial trips',
          'Anyone expecting the club to remove all personal responsibility',
          "Folks who aren't respectful of shared gear or group time",
        ],
      },
    ],
  },
  {
    id: 'what-is',
    title: 'What the club is',
    blocks: [
      {
        kind: 'p',
        text: 'We\'re a student-run club at UNLV that mixes organized trips with informal meetups. Some events are official and planned. Others start as "who\'s down?" messages in Discord.',
      },
      {
        kind: 'pRich',
        parts: [
          {
            text: 'Trips are planned by experienced members, with an emphasis on communication and shared responsibility. ',
          },
          {
            link: {
              label: '(Read more about safety & expectations)',
              href: '/safety',
            },
          },
        ],
      },
    ],
    ctaLinks: [{ label: 'How trips work →', href: '/faq#trips' }],
  },
  {
    id: 'vibe',
    title: '',
    hideInToc: true,
    variant: 'card',
    blocks: [
      {
        kind: 'p',
        text: 'In one sentence: Low-barrier outdoor access, shared knowledge, shared gear, good people.',
      },
    ],
  },
  {
    id: 'what-we-do',
    title: 'What we do',
    blocks: [
      {
        kind: 'p',
        text: 'A mix of weekly climbing and weekend adventures:',
      },
      {
        kind: 'listRich',
        items: [
          [
            { text: 'Climbing - indoor sessions at the UNLV rock wall and ' },
            {
              link: {
                label: 'Nevada Climbing Center',
                href: 'https://nevadaclimbingcenters.com/',
              },
            },
          ],
          [{ text: 'Camping - weekend trips with shared gear and meals' }],
          [{ text: 'Hiking - local and regional day hikes' }],
          [
            {
              text: 'Backpacking - beginner-friendly overnights when possible',
            },
          ],
          [{ text: 'Mountain biking - occasional, member-organized outings' }],
          [
            { text: 'Snow sports - we are partnered with ' },
            {
              link: {
                label: 'UNLV Snow Club',
                href: 'https://involvementcenter.unlv.edu/organization/unlvsnowclub',
              },
            },
            { text: ' for trips and gear' },
          ],
        ],
      },
    ],
    ctaLinks: [
      { label: 'See upcoming trips →', href: '/trips' },
      { label: 'What gear do I actually need? →', href: '/gear' },
    ],
  },
  {
    id: 'experience',
    title: "What it's like to be involved",
    subsections: [
      {
        id: 'experience-week',
        title: 'A regular week',
        body: 'Climbing meetups, Discord chatter, trip planning, and casual coordination.',
      },
      {
        id: 'experience-trip-day',
        title: 'A trip day',
        body: 'Meet up → carpool → get outside → share food / stoke → head back together.',
      },
      {
        id: 'experience-weekend',
        title: 'A weekend trip',
        body: 'Drive out, camp, climb or hike, eat together, hang out, repeat.',
      },
      {
        id: 'experience-social',
        title: 'The social side',
        body: 'Carpool conversations, shared meals, downtime at camp, learning by being around others.',
      },
    ],
    blocks: [],
  },
  {
    id: 'try-it',
    title: 'How to try it (no commitment)',
    blocks: [
      {
        kind: 'numbered',
        items: [
          'Join the Discord',
          'Show up to a climbing session',
          'RSVP to a trip',
          'Decide later if you want to become a member',
        ],
      },
      {
        kind: 'note',
        text: 'Membership is not required to see if this is your thing.',
      },
    ],
    ctaLinks: [
      { label: 'Join Discord →', href: DISCORD_INVITE_URL },
      { label: 'Where and when we meet →', href: '/faq#meetups' },
    ],
  },
  {
    id: 'reassurance',
    title: 'Quick reassurance',
    blocks: [
      {
        kind: 'list',
        items: [
          'Beginners are welcome',
          'No gear required to start',
          'No car required - we carpool',
          'Drop-in friendly',
          'No pressure to be consistent',
        ],
      },
    ],
  },
  {
    id: 'next',
    title: 'Where to go next',
    blocks: [],
    ctaLinks: [
      { label: 'Join Discord →', href: DISCORD_INVITE_URL },
      { label: 'View trips →', href: '/trips' },
      { label: 'Gear & what to bring →', href: '/gear' },
      { label: 'Costs & dues →', href: '/cost' },
      { label: 'Safety & expectations →', href: '/safety' },
      { label: 'Common questions →', href: '/faq' },
    ],
  },
]

export const gearSections: GuideSection[] = [
  {
    id: 'overview',
    title: 'Gear & equipment overview',
    blocks: [
      {
        kind: 'p',
        text: "Most people do not need to own outdoor gear to participate. The club rents and shares what's needed for trips.",
      },
    ],
  },
  {
    id: 'provided',
    title: 'What the club provides',
    blocks: [
      {
        kind: 'list',
        items: [
          'Tents',
          'Sleeping bags',
          'Backpacking backpacks',
          'Climbing ropes and hardware',
          'Harnesses and shared climbing gear',
        ],
      },
    ],
  },
  {
    id: 'bring',
    title: 'What you bring yourself',
    blocks: [
      {
        kind: 'list',
        items: [
          'Clothing appropriate for the activity',
          'Shoes (hiking shoes, climbing shoes if you have them)',
          'Personal items (water bottle, snacks, headlamp if you own one)',
        ],
      },
    ],
  },
  {
    id: 'closet',
    title: 'The gear closet',
    blocks: [
      {
        kind: 'p',
        text: 'Shared among members. Treat gear with care, return it clean, and communicate if something breaks or gets damaged.',
      },
    ],
  },
  {
    id: 'activity-notes',
    title: 'Activity-specific notes',
    subsections: [
      {
        id: 'activity-climbing',
        title: 'Climbing',
        body: 'Harnesses and ropes are provided; shoes are personal but often shareable at gyms.',
      },
      {
        id: 'activity-camping',
        title: 'Camping & backpacking',
        body: 'Major items are provided; clothing and footwear are not.',
      },
      {
        id: 'activity-hiking',
        title: 'Hiking',
        body: 'Bring your own food and water. Snacks to share are welcome but optional.',
      },
    ],
    blocks: [],
    ctaLinks: [{ label: 'See typical costs →', href: '/cost' }],
  },
  {
    id: 'bottom-line',
    title: '',
    hideInToc: true,
    variant: 'card',
    blocks: [
      {
        kind: 'p',
        text: "Bottom line: if gear is the only thing stopping you, don't let it.",
      },
    ],
  },
]

export const costSections: GuideSection[] = [
  {
    id: 'dues',
    title: 'Membership dues',
    blocks: [
      {
        kind: 'p',
        text: 'Annual dues help keep the club running and gear available.',
      },
      {
        kind: 'list',
        items: ['Paid once per year', 'Joining later is totally fine'],
      },
    ],
  },
  {
    id: 'used-for',
    title: 'How dues are used',
    blocks: [
      {
        kind: 'list',
        items: [
          'Gear maintenance and replacement',
          'Supporting trips',
          'Shared resources for members',
        ],
      },
    ],
  },
  {
    id: 'trip-costs',
    title: 'Typical trip costs',
    blocks: [
      {
        kind: 'list',
        items: ['Gas is usually split among the car', 'Food varies by trip'],
      },
    ],
  },
  {
    id: 'free',
    title: "What's free",
    blocks: [
      {
        kind: 'list',
        items: [
          'Gear rentals - just let us know what you need',
          'Dinner and water on overnight trips',
          'Trip planning and coordination',
        ],
      },
    ],
  },
  {
    id: 'reality',
    title: 'Cost reality check',
    blocks: [
      {
        kind: 'p',
        text: 'This club is designed to be one of the lowest-cost ways to get outside.',
      },
    ],
    ctaLinks: [
      { label: 'See what trips feel like →', href: '/start-here#experience' },
    ],
  },
]

export const safetySections: GuideSection[] = [
  {
    id: 'philosophy',
    title: 'Our safety philosophy',
    blocks: [
      {
        kind: 'p',
        text: 'We plan trips carefully, communicate clearly, and adapt as conditions change.',
      },
    ],
  },
  {
    id: 'leaders',
    title: 'Trip leaders & planning',
    blocks: [
      {
        kind: 'p',
        text: 'Trips are led by experienced members who handle logistics, pacing, and coordination.',
      },
    ],
  },
  {
    id: 'responsibility',
    title: 'Personal responsibility',
    blocks: [
      {
        kind: 'list',
        items: [
          'Leave no trace',
          'Know your limits',
          'Speak up early',
          'Make safe decisions',
        ],
      },
    ],
  },
  {
    id: 'waivers',
    title: 'Waivers & acknowledgements',
    blocks: [
      {
        kind: 'p',
        text: 'Required for official trips and RSVPs.',
      },
    ],
  },
  {
    id: 'comms',
    title: 'Communication expectations',
    blocks: [
      {
        kind: 'list',
        items: [
          'Read trip details',
          'Respond if plans change - updates on discord or text',
          'Be on time or communicate early',
        ],
      },
    ],
  },
  {
    id: 'cta',
    title: '',
    blocks: [],
    ctaLinks: [{ label: 'Read the FAQ →', href: '/faq' }],
  },
]

export const faqSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    blocks: [
      {
        kind: 'qa',
        items: [
          {
            question: 'Can I come alone?',
            answer: 'Yes - most people do at first.',
          },
          {
            question: 'What if I can only come once?',
            answer: "That's totally fine.",
          },
          {
            question: 'Do I need to join officially right away?',
            answer: 'No. Try it first.',
          },
        ],
      },
    ],
  },
  {
    id: 'experience-level',
    title: 'Experience & fitness',
    blocks: [
      {
        kind: 'qa',
        items: [
          {
            question: "What if I've never climbed or camped?",
            answer: "That's very common.",
          },
          {
            question: 'Do I need to be fit?',
            answer: 'No baseline fitness required; trips vary in difficulty.',
          },
        ],
      },
    ],
  },
  {
    id: 'transportation',
    title: 'Transportation & carpool',
    blocks: [
      {
        kind: 'qa',
        items: [
          {
            question: 'Do I need a car?',
            answer: 'No. Carpooling is standard.',
          },
        ],
      },
    ],
  },
  {
    id: 'friends',
    title: 'Friends & guests',
    blocks: [
      {
        kind: 'qa',
        items: [
          {
            question: 'Can I bring friends?',
            answer: 'Often yes, depending on the trip.',
          },
        ],
      },
    ],
  },
  {
    id: 'meetups',
    title: 'Where and when we meet',
    blocks: [
      {
        kind: 'list',
        items: [
          'Monday 5-7pm at the UNLV rock wall',
          'Tuesday and Friday evenings at Nevada Climbing Center',
          'One general meeting at the beginning of each semester',
          'Unofficial meets coordinated through Discord',
          'Official trips and events have designated meetup spots',
        ],
      },
    ],
  },
  {
    id: 'trips',
    title: 'How to join trips',
    blocks: [
      {
        kind: 'numbered',
        items: [
          'Follow Discord #announcements for trip info',
          'RSVP on Eventbrite',
          'Coordinate equipment and carpool needs',
          'Show up at the designated meetup spot',
        ],
      },
    ],
  },
  {
    id: 'membership',
    title: 'How to become a member',
    blocks: [
      {
        kind: 'numberedRich',
        items: [
          [
            { text: 'Join the UNLV Mountain Club organization in the ' },
            {
              link: {
                label: 'UNLV Involvement Center',
                href: 'https://involvementcenter.unlv.edu/organization/unlvmountainclub',
              },
            },
          ],
          [
            { text: 'Join the ' },
            { link: { label: 'Discord', href: DISCORD_INVITE_URL } },
            { text: ' and follow ' },
            { link: { label: 'Instagram', href: INSTAGRAM_URL } },
            { text: ' to connect with the community' },
          ],
          [{ text: 'Pay annual membership dues' }],
        ],
      },
    ],
    ctaLinks: [{ label: 'Pay membership dues →', href: '/membership' }],
  },
  {
    id: 'platforms',
    title: 'How we communicate',
    blocks: [
      {
        kind: 'list',
        items: [
          'Discord for communication and announcements',
          'Text for day-of coordination',
          'Eventbrite for RSVPs, waivers, emergency contact (coming soon to the web app)',
          'Instagram',
          'PhotoCircle for trip photos',
          'Email newsletter for trip announcements (coming soon)',
        ],
      },
    ],
  },
  {
    id: 'cta',
    title: 'Keep Exploring',
    blocks: [],
    ctaLinks: [
      { label: 'Join Discord →', href: DISCORD_INVITE_URL },
      { label: 'Gear & what to bring →', href: '/gear' },
      { label: 'Costs & dues →', href: '/cost' },
      { label: 'Start here page →', href: '/start-here' },
    ],
  },
]
