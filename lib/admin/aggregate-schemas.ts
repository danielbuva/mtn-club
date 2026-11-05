import { z } from 'zod'

const count = z.number().int().nonnegative()
const membershipCounts = {
  activeMembers: count,
  paidMembers: count,
  newMembers: count,
}

export const analyticsTotalsSchema = z.object({
  ...membershipCounts,
  accounts: count,
  applications: count,
  confirmedDues: count,
  confirmedRevenue: count,
  trips: count,
  publishedTrips: count,
  canceledTrips: count,
  archivedTrips: count,
  tripActivities: z.array(z.object({ activity: z.string(), count })),
  mailingOptIns: count,
  mailingOptOuts: count,
})

export const overviewTotalsSchema = z.object({
  ...membershipCounts,
  termName: z.string(),
  upcomingTrips: count,
  pendingPayments: count,
  pendingGuardians: count,
  pendingSchedule: count,
  pendingDeletions: count,
  inactiveHostTrips: count,
  incompleteTrips: count,
  nextTrip: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      startsAt: z.string(),
      endsAt: z.string().nullable(),
      location: z.string().nullable(),
      capacity: count.nullable(),
      isAllDay: z.boolean(),
      hosts: z.array(z.string()),
    })
    .nullable(),
})
