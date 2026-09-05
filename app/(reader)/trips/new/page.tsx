import { Suspense } from 'react'
import { NewTripLoading } from '@/components/admin/loading/new-trip'
import { NewEventPage } from '@/components/events/new-event-page'
import { getTripLeadershipOptions } from '@/lib/events/creation-options'
import { createClient } from '@/lib/supabase/server'

async function TripsNewPageContent({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; draft?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const [officialScope, updateScope] = user
    ? await Promise.all([
        supabase.rpc('admin_capability_scope', {
          p_uid: user.id,
          p_capability_key: 'trips.official',
        }),
        supabase.rpc('admin_capability_scope', {
          p_uid: user.id,
          p_capability_key: 'trips.update',
        }),
      ])
    : [{ data: null }, { data: null }]
  const canCreateOfficial = Boolean(officialScope.data)
  const canManageTags = Boolean(updateScope.data)
  const leadershipOptions = await getTripLeadershipOptions()
  const draftId = resolvedSearchParams?.draft

  const tagOptionsRes = await supabase
    .from('trip_tag_options')
    .select('tag')
    .order('tag')

  const dbTagOptions = (tagOptionsRes.data ?? [])
    .map(row => row.tag.trim())
    .filter(Boolean)
  const activityOptions = Array.from(new Set(dbTagOptions)).sort((a, b) =>
    a.localeCompare(b),
  )

  const initialDraft =
    user && draftId
      ? await supabase
          .from('trip_drafts')
          .select('*')
          .eq('id', draftId)
          .eq('created_by', user.id)
          .maybeSingle()
      : { data: null, error: null }

  if (tagOptionsRes.error || initialDraft.error)
    throw new Error('Unable to load the trip form. Please retry.')

  return (
    <NewEventPage
      initialType={resolvedSearchParams?.type}
      initialDraft={initialDraft.data ?? null}
      isAuthenticated={Boolean(user)}
      canCreateOfficial={canCreateOfficial}
      canManageTags={canManageTags}
      activityOptions={activityOptions}
      {...leadershipOptions}
    />
  )
}

export default function TripsNewPage(
  props: Parameters<typeof TripsNewPageContent>[0],
) {
  return (
    <Suspense fallback={<NewTripLoading />}>
      <TripsNewPageContent {...props} />
    </Suspense>
  )
}
