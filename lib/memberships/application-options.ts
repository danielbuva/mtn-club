export const MEMBERSHIP_INTEREST_OPTIONS = [
  'Hiking',
  'Camping',
  'Climbing',
  'Backpacking',
  'Mountain Biking',
  'Snow Sports',
  'Water Sports',
] as const

export type MembershipInterest =
  | (typeof MEMBERSHIP_INTEREST_OPTIONS)[number]
  | 'Other'

export function encodeMembershipInterests(interests: string[]): string {
  return JSON.stringify(interests)
}

export function decodeMembershipInterests(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    }
  } catch {
    // Older applications stored one plain-text interest.
  }

  const legacyValue = value.trim()
  return legacyValue ? [legacyValue] : []
}

export type MembershipApplicationDraft = {
  fullName: string
  contactEmail: string
  ageStatus: 'adult' | 'minor'
  guardianConsent: 'not_required' | 'pending' | 'confirmed'
  duesPaymentClaimed: boolean
  primaryInterest: string
  experienceNotes: string
  status: 'submitted' | 'confirmed' | 'withdrawn'
}
