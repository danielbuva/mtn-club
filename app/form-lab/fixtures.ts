import { emptyEventValues } from '@/lib/events/form-values'
import { snapshotSchema } from '@/lib/registration/schema'
import {
  createUnlvWaiver,
  unlvWaiverSource,
} from '@/lib/registration/unlv-waiver'

const registrationTitle = 'Sunrise at Calico Tanks'
const registrationDate = '11/14/2026'
const registrationRisks =
  'Hiking and scrambling on steep, uneven sandstone and loose rock; slips, trips, and falls; falling rock; heat, sun exposure, dehydration, sudden weather changes, wildlife encounters, and delayed access to emergency medical care.'

export const creationFixture = {
  ...emptyEventValues(true),
  title: registrationTitle,
  shortSummary: 'An early start, sandstone trails, and a view worth sharing.',
  activityTypes: ['hiking'],
  startAt: '2026-11-14T06:00',
  endAt: '2026-11-14T11:00',
  primaryLocationName: 'Red Rock Canyon',
  meetingLocationName: 'UNLV campus',
  collectTransportation: true,
}
export const registrationFixture = snapshotSchema.parse({
  tripId: '11111111-1111-4111-8111-111111111111',
  title: 'Sunrise at Calico Tanks',
  startAt: '2026-11-14T14:00:00Z',
  endAt: '2026-11-14T19:00:00Z',
  timeZone: 'America/Los_Angeles',
  availability: 'open',
  closeAt: '2026-11-13T20:00:00Z',
  eligibility: 'account',
  eligibilityReasons: [],
  requirements: [],
  capacity: 16,
  confirmedCount: 8,
  reservedCount: 0,
  waitlistCount: 0,
  state: 'incomplete',
  revision: 1,
  authenticated: true,
  canManage: false,
  canReviewGuardian: false,
  emailEnabled: true,
  actions: ['register', 'save_draft'],
  ageAdult: null,
  formVersion: 1,
  questions: [
    {
      id: 'experience',
      label: 'How does this trail sound?',
      type: 'single',
      required: true,
      options: ['Right up my alley', 'A new adventure for me'],
    },
  ],
  collectTransportation: true,
  transportation: null,
  emergencyRequired: true,
  waiverRequired: true,
  waiverSigned: false,
  waiver: {
    id: '22222222-2222-4222-8222-222222222222',
    title: `${registrationTitle} — UNLV RSO waiver`,
    version: 1,
    body: createUnlvWaiver(
      registrationTitle,
      registrationDate,
      registrationRisks,
    ),
    sourceUrl: unlvWaiverSource,
  },
  answers: {},
  emergencyContact: { name: '', phone: '', relationship: '', notes: '' },
  offer: null,
  events: [],
  attendees: [],
})
