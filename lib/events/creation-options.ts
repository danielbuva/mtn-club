import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function getTripLeadershipOptions() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const empty = { publicHostOptions: [], leaderOptions: [] }
  if (!user) return empty
  const { data: scope, error } = await supabase.rpc('admin_capability_scope', {
    p_uid: user.id,
    p_capability_key: 'trips.update',
  })
  if (error) throw new Error('Unable to check trip permissions. Please retry.')
  if (scope !== 'all' && scope !== 'assigned') return empty

  const admin = createAdminClient()
  const [hosts, assignments, profiles] = await Promise.all([
    admin
      .from('club_hosts')
      .select('id, public_name, club_title')
      .eq('is_active', true)
      .order('display_order'),
    admin.from('admin_user_roles').select('user_id'),
    admin.from('profiles').select('user_id, display_name'),
  ])
  if (hosts.error || assignments.error || profiles.error) {
    throw new Error('Unable to load trip leaders. Please retry.')
  }
  const leadershipIds = new Set(assignments.data.map(item => item.user_id))
  return {
    publicHostOptions: hosts.data.map(host => ({
      id: host.id,
      label: `${host.public_name} — ${host.club_title}`,
    })),
    leaderOptions: profiles.data
      .filter(profile => leadershipIds.has(profile.user_id))
      .map(profile => ({ id: profile.user_id, label: profile.display_name })),
  }
}
