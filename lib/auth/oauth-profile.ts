import { createClient } from '@/lib/supabase/server'

const getString = (record: Record<string, unknown>, key: string) => {
  const value = record[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const splitFullName = (fullName: string) => {
  const parts = fullName
    .split(/\s+/)
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length === 0) {
    return { firstName: null, lastName: null }
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

const buildDefaultsFromMetadata = (
  metadata: Record<string, unknown>,
  email: string | null,
) => {
  const givenName = getString(metadata, 'given_name')
  const familyName = getString(metadata, 'family_name')
  const fullName =
    getString(metadata, 'full_name') ?? getString(metadata, 'name')
  const fallbackFromFullName = fullName ? splitFullName(fullName) : null

  const firstName = givenName ?? fallbackFromFullName?.firstName ?? null
  const lastName = familyName ?? fallbackFromFullName?.lastName ?? null

  const displayName =
    fullName ??
    ([firstName, lastName].filter(Boolean).join(' ').trim() ||
      getString(metadata, 'preferred_username')) ??
    getString(metadata, 'user_name') ??
    getString(metadata, 'username') ??
    (email ? email.split('@')[0] : null) ??
    'Member'

  const avatarUrl =
    getString(metadata, 'avatar_url') ??
    getString(metadata, 'picture') ??
    getString(metadata, 'image')

  const username =
    getString(metadata, 'preferred_username') ??
    getString(metadata, 'user_name') ??
    getString(metadata, 'username')

  return { firstName, lastName, displayName, avatarUrl, username }
}

export const maybeHydrateProfileFromOAuth = async () => {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return

  const metadata =
    user.user_metadata && typeof user.user_metadata === 'object'
      ? (user.user_metadata as Record<string, unknown>)
      : {}

  const defaults = buildDefaultsFromMetadata(metadata, user.email ?? null)

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select(
      'user_id, display_name, first_name, last_name, avatar_url, username',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingProfileError) {
    console.error(
      'Unable to load profile for OAuth metadata hydration:',
      existingProfileError,
    )
    return
  }

  if (!existingProfile) {
    const { error: insertError } = await supabase.from('profiles').insert({
      user_id: user.id,
      display_name: defaults.displayName,
      first_name: defaults.firstName,
      last_name: defaults.lastName,
      avatar_url: defaults.avatarUrl,
      username: defaults.username,
    })

    if (insertError) {
      console.error('Unable to create OAuth profile defaults:', insertError)
    }
    return
  }

  const updates: {
    display_name?: string
    first_name?: string | null
    last_name?: string | null
    avatar_url?: string | null
    username?: string | null
  } = {}

  if (!existingProfile.display_name?.trim()) {
    updates.display_name = defaults.displayName
  }
  if (!existingProfile.first_name?.trim() && defaults.firstName) {
    updates.first_name = defaults.firstName
  }
  if (!existingProfile.last_name?.trim() && defaults.lastName) {
    updates.last_name = defaults.lastName
  }
  if (!existingProfile.avatar_url?.trim() && defaults.avatarUrl) {
    updates.avatar_url = defaults.avatarUrl
  }
  if (!existingProfile.username?.trim() && defaults.username) {
    updates.username = defaults.username
  }

  if (Object.keys(updates).length === 0) return

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Unable to update OAuth profile defaults:', updateError)
  }
}
