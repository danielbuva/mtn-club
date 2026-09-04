import { NewEventPage } from '@/components/events/new-event-page'
import { requireAdminCapability } from '@/lib/admin/auth'
import { getTripLeadershipOptions } from '@/lib/events/creation-options'
import { createClient } from '@/lib/supabase/server'

export default async function AdminNewTripPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const context = await requireAdminCapability('trips.create')
  const supabase = await createClient()
  const { draft } = await searchParams
  const [tagsResult, leadershipOptions, draftResult] = await Promise.all([
    supabase.from('trip_tag_options').select('tag').order('tag'),
    getTripLeadershipOptions(),
    draft
      ? supabase
          .from('trip_drafts')
          .select('*')
          .eq('id', draft)
          .eq('created_by', context.userId)
          .maybeSingle()
      : { data: null, error: null },
  ])
  const tags = tagsResult.data
  const activityOptions = Array.from(
    new Set((tags ?? []).map(item => item.tag.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))
  if (tagsResult.error || draftResult.error)
    throw new Error('Unable to load the trip form. Please retry.')

  return (
    <NewEventPage
      initialType="official"
      initialDraft={draftResult.data}
      isAuthenticated
      canCreateOfficial={Boolean(context.permissions['trips.official'])}
      canManageTags={Boolean(context.permissions['trips.update'])}
      activityOptions={activityOptions}
      {...leadershipOptions}
      successPath="/admin/trips"
    />
  )
}
