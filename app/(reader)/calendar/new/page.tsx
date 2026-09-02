import { NewEventPage } from '@/components/events/new-event-page'
import { getViewer } from '@/lib/auth/viewer'

export default async function CalendarNewPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>
}) {
  const viewer = await getViewer()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const canCreateOfficial = Boolean(
    viewer.member?.role && viewer.member.role !== 'regular',
  )
  const canManageTags = ['staff', 'leadership', 'admin'].includes(
    viewer.member?.role ?? '',
  )

  return (
    <NewEventPage
      initialType={resolvedSearchParams?.type}
      initialDraft={null}
      isAuthenticated={viewer.isAuthenticated}
      canCreateOfficial={canCreateOfficial}
      canManageTags={canManageTags}
      activityOptions={[]}
    />
  )
}
