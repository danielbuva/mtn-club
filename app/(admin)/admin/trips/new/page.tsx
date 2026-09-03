import { NewEventPage } from '@/components/events/new-event-page'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export default async function AdminNewTripPage() {
  const context = await requireAdminCapability('trips.create')
  const supabase = await createClient()
  const admin = createAdminClient()
  const [tagsResult, hostsResult, assignmentsResult, profilesResult] =
    await Promise.all([
      supabase.from('trip_tag_options').select('tag').order('tag'),
      admin
        .from('club_hosts')
        .select('id, public_name, club_title')
        .eq('is_active', true)
        .order('display_order'),
      admin.from('admin_user_roles').select('user_id'),
      admin.from('profiles').select('user_id, display_name'),
    ])
  const tags = tagsResult.data
  const activityOptions = Array.from(
    new Set((tags ?? []).map(item => item.tag.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))
  const leadershipIds = new Set(
    (assignmentsResult.data ?? []).map(item => item.user_id),
  )
  const publicHostOptions = (hostsResult.data ?? []).map(host => ({
    id: host.id,
    label: `${host.public_name} — ${host.club_title}`,
  }))
  const leaderOptions = (profilesResult.data ?? [])
    .filter(profile => leadershipIds.has(profile.user_id))
    .map(profile => ({ id: profile.user_id, label: profile.display_name }))

  return (
    <NewEventPage
      initialType="trip"
      initialDraft={null}
      isAuthenticated
      canCreateOfficial={Boolean(context.permissions['trips.official'])}
      canManageTags={Boolean(context.permissions['trips.update'])}
      activityOptions={activityOptions}
      publicHostOptions={publicHostOptions}
      leaderOptions={leaderOptions}
      successPath="/admin/trips"
    />
  )
}
