export function parseEmailOtpType(value: string | null) {
  switch (value) {
    case 'signup':
    case 'invite':
    case 'magiclink':
    case 'recovery':
    case 'email_change':
    case 'email':
      return value
    default:
      return null
  }
}
