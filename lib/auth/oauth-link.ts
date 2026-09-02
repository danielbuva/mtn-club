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
    return 'Provider linking is not enabled for this project yet. Ask an admin to enable identity linking in Supabase Auth.'
  }

  const code = getErrorCode(error)
  if (code === 'identity_already_exists') {
    return 'That provider account is already connected to another user. Sign in with that provider first, then ask an admin to merge accounts.'
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'Unable to connect provider. Please try again.'
}
