import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { ProfileRow, ProfileUpdate } from '@/lib/profile/types'

export type ProfileLookup = {
  userId: string | null
  email: string | null
  profile: ProfileRow | null
}

export async function fetchProfile(
  client: SupabaseClient<Database>
): Promise<ProfileLookup> {
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError) {
    throw authError
  }

  if (!authData.user) {
    return { userId: null, email: null, profile: null }
  }

  const { data, error } = await client
    .from('app_users')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile:', error)
    throw error
  }

  return {
    userId: authData.user.id,
    email: authData.user.email ?? null,
    profile: data ?? null,
  }
}

export async function upsertProfile(
  client: SupabaseClient<Database>,
  userId: string,
  payload: ProfileUpdate
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('app_users')
    .upsert({ ...payload, id: userId }, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}
