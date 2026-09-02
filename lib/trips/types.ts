export type TripActivityType =
  | 'climbing'
  | 'hiking'
  | 'camping'
  | 'backpacking'
  | 'other'

export type TripDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type TripStatus =
  | 'open'
  | 'waitlist'
  | 'full'
  | 'members_only'
  | 'cancelled'

export type TripRsvpChoice = 'going' | 'waitlisted' | 'not_going' | null

export type TripListItem = {
  id: string
  title: string
  activityType: TripActivityType
  activityTags: string[]
  heroImageUrl?: string
  locationName: string
  startAt: Date
  endAt?: Date
  isAllDay?: boolean
  difficulty?: TripDifficulty
  capacity?: number
  rsvpCount?: number
  status: TripStatus
  visibility?: 'public' | 'members' | 'minimal'
  waitlistEnabled?: boolean
  currentUserRsvp?: TripRsvpChoice
  leaderName?: string
  leaderAvatarUrl?: string
  tags?: string[]
  detailHref?: string

  climbStyle?: string
  gradeMin?: string
  gradeMax?: string
  distanceMi?: number
  elevationFt?: number
  nights?: number
  campStyle?: string
}

export type TripAttendee = {
  userId: string
  name: string
  avatarUrl?: string
}

export type TripDetail = {
  id: string
  title: string
  activityType: TripActivityType
  activityTags: string[]
  heroImageUrl?: string
  locationName: string
  locationNotes?: string
  startAt: Date
  endAt?: Date
  isAllDay?: boolean
  difficulty?: TripDifficulty
  status: TripStatus
  capacity?: number
  rsvpCount?: number
  leaderName?: string
  leaderAvatarUrl?: string
  leaderContact?: string
  summary?: string
  description?: string
  overviewWhat?: string
  overviewWhere?: string
  overviewWeather?: string
  overviewEquipment?: string
  overviewCarpoolNeedGear?: string
  itinerary?: string
  gearList?: string[]
  requirements?: string[]
  tags?: string[]
  climbStyle?: string
  gradeMin?: string
  gradeMax?: string
  distanceMi?: number
  elevationFt?: number
  nights?: number
  campStyle?: string
  attendees?: TripAttendee[]
  viewerRsvpStatus?: TripRsvpChoice
  visibility?: 'public' | 'members' | 'minimal'
  waitlistEnabled?: boolean
}
