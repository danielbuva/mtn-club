type Identity = { id: string; email?: string | null }
type Account = Identity & { app_metadata: Record<string, unknown> }
export type VerificationResult = {
  error: string | null
  verified?: boolean
  retryAfter?: number
}
type ProofServices = {
  verify: (
    email: string,
    code: string,
  ) => Promise<{ user: Identity | null; error: string | null }>
  currentAccount: (id: string) => Promise<Account | null>
  saveMetadata: (
    id: string,
    metadata: Record<string, unknown>,
  ) => Promise<boolean>
}

// No cookie/session-writing operation is available to this mailbox-proof flow.
export async function verifyEmailProof(
  user: Identity,
  code: string,
  services: ProofServices,
): Promise<VerificationResult> {
  if (!/^\d{6}$/.test(code))
    return { error: 'Enter the six-digit code from your email.' }
  const email = user.email?.toLowerCase()
  if (!email) return { error: 'Sign in again to verify your email.' }
  const verified = await services.verify(email, code)
  if (verified.error) return { error: verified.error }
  if (
    !verified.user ||
    verified.user.id !== user.id ||
    verified.user.email?.toLowerCase() !== email
  ) {
    return {
      error: 'This code does not match your account. Request a new code.',
    }
  }
  return saveEmailProof(user, services)
}

// Call only after a successful server-side OTP/link verification. Never use an
// email_confirmed_at timestamp or browser-submitted user as mailbox proof.
export async function saveEmailProof(
  user: Identity,
  services: Pick<ProofServices, 'currentAccount' | 'saveMetadata'>,
): Promise<VerificationResult> {
  const email = user.email?.toLowerCase()
  if (!email) return { error: 'Sign in again to verify your email.' }
  const current = await services.currentAccount(user.id)
  if (
    !current ||
    current.id !== user.id ||
    current.email?.toLowerCase() !== email
  ) {
    return {
      error:
        'Your email has changed. Refresh this page and request a new code.',
    }
  }
  const saved = await services.saveMetadata(user.id, {
    ...current.app_metadata,
    email_verification: { email, verified_at: new Date().toISOString() },
  })
  return saved
    ? { error: null, verified: true }
    : {
        error:
          'We couldn’t save verification. Request a new code and try again.',
      }
}
