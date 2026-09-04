type Identity = { provider: string; identity_data?: unknown }
type VerificationUser = {
  email?: string
  app_metadata: unknown
  identities?: Identity[]
}
export type EmailVerificationStatus = {
  verified: boolean
  method: 'code' | 'google' | 'discord' | null
}
function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
export function getEmailVerificationStatus(
  user: VerificationUser,
): EmailVerificationStatus {
  const email = user.email?.trim().toLowerCase()
  if (!email) return { verified: false, method: null }
  const proof = record(record(user.app_metadata)?.email_verification)
  if (
    proof?.email === email &&
    typeof proof.verified_at === 'string' &&
    Number.isFinite(Date.parse(proof.verified_at))
  )
    return { verified: true, method: 'code' }
  for (const identity of user.identities ?? []) {
    if (identity.provider !== 'google' && identity.provider !== 'discord')
      continue
    const data = record(identity.identity_data)
    if (
      typeof data?.email === 'string' &&
      data.email.toLowerCase() === email &&
      data.email_verified === true
    )
      return { verified: true, method: identity.provider }
  }
  return { verified: false, method: null }
}
