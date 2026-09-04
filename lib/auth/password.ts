export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_GUIDANCE =
  'Use at least 12 characters. A unique passphrase works well; spaces are welcome.'
export function passwordError(password: string): string | undefined {
  return Array.from(password).length < PASSWORD_MIN_LENGTH
    ? `Use at least ${PASSWORD_MIN_LENGTH} characters.`
    : undefined
}
export type CredentialValues = {
  email: string
  password: string
  confirmPassword: string
}
export type CredentialField = keyof CredentialValues
export type CredentialErrors = Partial<Record<CredentialField, string>>
export function validateCredentials(
  values: CredentialValues,
  mode: 'login' | 'signup',
): CredentialErrors {
  const errors: CredentialErrors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Enter your password.'
  else if (mode === 'signup') errors.password = passwordError(values.password)
  if (mode === 'signup' && values.confirmPassword !== values.password)
    errors.confirmPassword = 'Passwords do not match.'
  return errors
}
