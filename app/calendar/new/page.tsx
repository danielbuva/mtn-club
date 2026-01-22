import { NewEventPage } from '@/components/events/new-event-page'
import { getMembershipState } from '@/lib/memberships/server'

export default async function CalendarNewPage({
  searchParams,
}: {
  searchParams?: { type?: string }
}) {
  const membershipState = await getMembershipState()
  return <NewEventPage initialType={searchParams?.type} membershipState={membershipState} />
}
