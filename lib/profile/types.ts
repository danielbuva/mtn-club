import type { ProfileFormInput } from '@/lib/profile/schemas'
import type { Database, Json } from '@/lib/supabase/types'

type ProfilePublicRow = Database['public']['Tables']['profiles']['Row']
type ProfilePrivateRow = Database['public']['Tables']['profile_private']['Row']

export type ProfileRow = ProfilePublicRow & {
  birthday: ProfilePrivateRow['birthday']
  carpool_profile: ProfilePrivateRow['carpool_profile']
  emergency_contact: ProfilePrivateRow['emergency_contact']
  gear_profile: ProfilePrivateRow['gear_profile']
  phone: ProfilePrivateRow['phone']
  privacy_settings: Json | null
  travel_profile: Json | null
  skills_certs: Json | null
  interests_preferences: Json | null
  notification_settings: Json | null
}

export type ProfileUpdate = {
  display_name?: string
  username?: string | null
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  pronouns?: string | null
  phone?: string | null
  birthday?: string | null
  emergency_contact?: Json | null
  carpool_profile?: Json | null
  gear_profile?: Json | null
  privacy_settings?: Json | null
  travel_profile?: Json | null
  skills_certs?: Json | null
  interests_preferences?: Json | null
  notification_settings?: Json | null
  updated_at?: string
}

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
