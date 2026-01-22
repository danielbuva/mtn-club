import { NewEventPage } from '@/components/events/new-event-page'
import { getMembershipState } from '@/lib/memberships/server'

export default async function CalendarNewPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>
}) {
  const membershipState = await getMembershipState()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  return <NewEventPage initialType={resolvedSearchParams?.type} membershipState={membershipState} />
}
