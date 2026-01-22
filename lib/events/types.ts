import type { Database } from '@/lib/supabase/types'

export type EventRow = Database['public']['Tables']['trips']['Row']
export type EventInsert = Database['public']['Tables']['trips']['Insert']
export type EventUpdate = Database['public']['Tables']['trips']['Update']

export type EventKind = Database['public']['Enums']['trip_kind']
export type EventStatus = Database['public']['Enums']['trip_status']
export type EventVisibility = Database['public']['Enums']['trip_visibility']

export type EventDifficulty = 'Easy' | 'Moderate' | 'Challenging' | 'Expert'

export type CalendarTrip = {
  id: string
  title: string
  state: string
  coordinates: { lat: number; lng: number }
  dateStart: string
  dateEnd: string
  difficulty: EventDifficulty
  miles: number | null
  elevationGain: number | null
  tags: string[]
  photos: string[]
  membersOnly: boolean
  description: string
  meetingTime: string
  meetingLocation: string
  isOfficial: boolean
}

export type TripTeaserDay = {
  day: string // yyyy-mm-dd
  event_count: number
  official_count: number
}
