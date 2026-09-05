import type { Database } from '@/lib/supabase/types'

export type EventRow = Database['public']['Tables']['trips']['Row']
export type EventInsert = Database['public']['Tables']['trips']['Insert']
export type EventUpdate = Database['public']['Tables']['trips']['Update']

export type EventVisibility = Database['public']['Enums']['trip_visibility']

export type EventDifficulty = 'Easy' | 'Moderate' | 'Challenging' | 'Expert'

export type CalendarTrip = {
  lifecycleStatus?: 'published' | 'canceled' | 'archived'
  cancellationReason?: string | null
  scheduleKey?: string | null
  id: string
  title: string
  state: string
  coordinates: { lat: number; lng: number }
  dateStart: string
  dateEnd: string
  difficulty: EventDifficulty | null
  miles: number | null
  elevationGain: number | null
  tags: string[]
  photos: string[]
  membersOnly: boolean
  description: string
  meetingTime: string | null
  meetingLocation: string
  isOfficial: boolean
  isAllDay: boolean
  hosts: { name: string; title: string }[]
}

export type TripTeaserDay = {
  day: string // yyyy-mm-dd
  event_count: number
  official_count: number
}
