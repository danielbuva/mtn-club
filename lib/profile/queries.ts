import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProfileRow, ProfileUpdate } from '@/lib/profile/types'
import type { Database, Json } from '@/lib/supabase/types'

export type ProfileLookup = {
  userId: string | null
  email: string | null
  profile: ProfileRow | null
}

const mergeProfileRows = (
  profile: Database['public']['Tables']['profiles']['Row'] | null,
  profilePrivate: Database['public']['Tables']['profile_private']['Row'] | null,
): ProfileRow | null => {
  if (!profile) return null

  return {
    ...profile,
    birthday: profilePrivate?.birthday ?? null,
    carpool_profile: profilePrivate?.carpool_profile ?? null,
    emergency_contact: profilePrivate?.emergency_contact ?? null,
    gear_profile: profilePrivate?.gear_profile ?? null,
    phone: profilePrivate?.phone ?? null,
    privacy_settings: (profilePrivate?.privacy_settings as Json | null) ?? null,
    travel_profile: (profilePrivate?.travel_profile as Json | null) ?? null,
    skills_certs: (profilePrivate?.skills_certs as Json | null) ?? null,
    interests_preferences:
      (profilePrivate?.interests_preferences as Json | null) ?? null,
    notification_settings:
      (profilePrivate?.notification_settings as Json | null) ?? null,
  }
}

export async function fetchProfile(
  client: SupabaseClient<Database>,
): Promise<ProfileLookup> {
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError) {
    throw authError
  }

  if (!authData.user) {
    return { userId: null, email: null, profile: null }
  }

  const userId = authData.user.id

  const { data: profileData, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    throw profileError
  }

  const { data: privateData, error: privateError } = await client
    .from('profile_private')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (privateError) {
    console.error('Error fetching profile private:', privateError)
    throw privateError
  }

  return {
    userId,
    email: authData.user.email ?? null,
    profile: mergeProfileRows(profileData ?? null, privateData ?? null),
  }
}

export async function upsertProfile(
  client: SupabaseClient<Database>,
  userId: string,
  payload: ProfileUpdate,
): Promise<ProfileRow> {
  const profilePayload: Database['public']['Tables']['profiles']['Update'] = {}
  const privatePayload: Database['public']['Tables']['profile_private']['Update'] =
    {}

  if (payload.display_name !== undefined) {
    profilePayload.display_name = payload.display_name
  }
  if (payload.username !== undefined) {
    profilePayload.username = payload.username
  }
  if (payload.first_name !== undefined) {
    profilePayload.first_name = payload.first_name
  }
  if (payload.last_name !== undefined) {
    profilePayload.last_name = payload.last_name
  }
  if (payload.avatar_url !== undefined) {
    profilePayload.avatar_url = payload.avatar_url
  }
  if (payload.bio !== undefined) {
    profilePayload.bio = payload.bio
  }
  if (payload.pronouns !== undefined) {
    profilePayload.pronouns = payload.pronouns
  }
  if (payload.updated_at !== undefined) {
    profilePayload.updated_at = payload.updated_at
  }

  if (payload.phone !== undefined) {
    privatePayload.phone = payload.phone
  }
  if (payload.birthday !== undefined) {
    privatePayload.birthday = payload.birthday
  }
  if (payload.emergency_contact !== undefined) {
    privatePayload.emergency_contact = payload.emergency_contact
  }
  if (payload.carpool_profile !== undefined) {
    privatePayload.carpool_profile = payload.carpool_profile
  }
  if (payload.gear_profile !== undefined) {
    privatePayload.gear_profile = payload.gear_profile
  }
  if (payload.privacy_settings !== undefined) {
    privatePayload.privacy_settings = payload.privacy_settings
  }
  if (payload.travel_profile !== undefined) {
    privatePayload.travel_profile = payload.travel_profile
  }
  if (payload.skills_certs !== undefined) {
    privatePayload.skills_certs = payload.skills_certs
  }
  if (payload.interests_preferences !== undefined) {
    privatePayload.interests_preferences = payload.interests_preferences
  }
  if (payload.notification_settings !== undefined) {
    privatePayload.notification_settings = payload.notification_settings
  }
  if (payload.updated_at !== undefined) {
    privatePayload.updated_at = payload.updated_at
  }

  if (Object.keys(profilePayload).length > 0) {
    const profileInsert: Database['public']['Tables']['profiles']['Insert'] = {
      user_id: userId,
      display_name: profilePayload.display_name ?? 'Member',
      ...profilePayload,
    }

    const { error } = await client
      .from('profiles')
      .upsert(profileInsert, { onConflict: 'user_id' })

    if (error) {
      throw error
    }
  } else {
    const { data: existingProfile, error } = await client
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!existingProfile) {
      const { error: insertError } = await client
        .from('profiles')
        .insert({ user_id: userId, display_name: 'Member' })

      if (insertError) {
        throw insertError
      }
    }
  }

  if (Object.keys(privatePayload).length > 0) {
    const privateInsert: Database['public']['Tables']['profile_private']['Insert'] =
      {
        user_id: userId,
        ...privatePayload,
      }

    const { error } = await client
      .from('profile_private')
      .upsert(privateInsert, { onConflict: 'user_id' })

    if (error) {
      throw error
    }
  }

  const { data: profileData, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError) {
    throw profileError
  }

  const { data: privateData, error: privateError } = await client
    .from('profile_private')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (privateError) {
    throw privateError
  }

  const merged = mergeProfileRows(profileData, privateData ?? null)
  if (!merged) {
    throw new Error('Profile row missing after upsert')
  }

  return merged
}
