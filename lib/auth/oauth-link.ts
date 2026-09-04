export const isNotFoundError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  (error as { status?: unknown }).status === 404

const getErrorCode = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return null
  }
  if (
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code
  }
  return null
}

export const getOAuthLinkErrorMessage = (error: unknown) => {
  if (isNotFoundError(error)) {
    return 'Connecting sign-in methods is temporarily unavailable. Your existing sign-in methods still work. Please contact club support.'
  }

  const code = getErrorCode(error)
  if (code === 'identity_already_exists') {
    return 'That provider is connected to another club account. Nothing was merged. Club support can help after verifying you own both accounts.'
  }

  if (
    code === 'email_conflict_identity_not_deletable' ||
    code === 'multiple_accounts'
  )
    return 'We found an account conflict. Nothing was merged. Contact club support to verify ownership and review your sign-in options.'
  return 'We could not connect that provider. Your existing methods still work. Try again or contact club support.'
}
