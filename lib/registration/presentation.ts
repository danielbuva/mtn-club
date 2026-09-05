import type { TripRsvpChoice, TripStatus } from '@/lib/trips/types'
import type { TripRegistrationSnapshot } from './schema'

export function legacyRsvpChoice(
  state: TripRegistrationSnapshot['state'],
): TripRsvpChoice {
  if (state === 'confirmed') return 'going'
  if (state === 'waitlisted' || state === 'offered') return 'waitlisted'
  if (state === 'cancelled') return 'not_going'
  return null
}
export function registrationTripStatus(
  availability: TripRegistrationSnapshot['availability'],
): TripStatus {
  if (availability === 'canceled') return 'cancelled'
  if (
    availability === 'disabled' ||
    availability === 'closed' ||
    availability === 'archived'
  )
    return 'closed'
  return availability
}
