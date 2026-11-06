/**
 * Accounts created on or after this moment must have a first and last name.
 * Older accounts keep working with whatever name they have.
 */
export const NAME_REQUIRED_SINCE = '2026-11-06T04:00:00Z'

export function nameRequiredFor(user: { created_at: string }) {
  return new Date(user.created_at).getTime() >= Date.parse(NAME_REQUIRED_SINCE)
}

export function hasFullName(
  profile: { first_name: string | null; last_name: string | null } | null,
) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim())
}
