export const oauthProviders = ['google', 'discord'] as const
export type OAuthProvider = (typeof oauthProviders)[number]
export const providerLabel = { google: 'Google', discord: 'Discord' }
export function parseOAuthProvider(value: unknown): OAuthProvider | null {
  return value === 'google' || value === 'discord' ? value : null
}
type Identity = { provider: string }
export function connectedOAuthProviders(identities: Identity[] = []) {
  return oauthProviders.filter(provider =>
    identities.some(identity => identity.provider === provider),
  )
}
export function isExpectedLinkedAccount(
  expected: { userId: string; provider: OAuthProvider },
  user: { id: string; identities?: Identity[] } | null,
) {
  return (
    user?.id === expected.userId &&
    connectedOAuthProviders(user.identities).includes(expected.provider)
  )
}
