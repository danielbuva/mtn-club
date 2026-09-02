import { NewEventPage } from '@/components/events/new-event-page'
import { createClient } from '@/lib/supabase/server'

export default async function TripsNewPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; draft?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const membership = user
    ? await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const role = membership.data?.role
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const canCreateOfficial = Boolean(role && role !== 'regular')
  const canManageTags = ['staff', 'leadership', 'admin'].includes(role ?? '')
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
      : { data: null }

  return (
    <NewEventPage
      initialType={resolvedSearchParams?.type}
      initialDraft={initialDraft.data ?? null}
      isAuthenticated={Boolean(user)}
      canCreateOfficial={canCreateOfficial}
      canManageTags={canManageTags}
      activityOptions={activityOptions}
    />
  )
}
