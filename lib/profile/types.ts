import type { Database } from '@/lib/supabase/types'
import type { ProfileFormInput } from '@/lib/profile/schemas'

export type ProfileRow = Database['public']['Tables']['app_users']['Row']
export type ProfileUpdate = Database['public']['Tables']['app_users']['Update']

export type EmergencyContact = {
  name: string
  relationship: string
  phone: string
  notes: string
}

export type PrivacySettings = {
  shareEmail: boolean
  sharePhone: boolean
  profileVisible: boolean
  shareGear: boolean
  shareCarpooling: boolean
  shareCarInfo: boolean
  shareNeighborhood: boolean
}

export type TravelProfile = {
  hasCar: boolean
  seats: string
  departureCity: string
  willingToDrive: boolean
}

export type GearProfile = {
  gearOwned: string
  gearNeeded: string
}

export type SkillsCerts = {
  skills: string
  certifications: string
}

export type InterestsPreferences = {
  interests: string
  preferredActivities: string
  availability: string
}

export type NotificationSettings = {
  email: boolean
  sms: boolean
  announcements: boolean
  tripUpdates: boolean
  memberStories: boolean
  safetyAlerts: boolean
  digestFrequency: 'daily' | 'weekly' | 'monthly'
}

export type ProfileFormValues = ProfileFormInput
