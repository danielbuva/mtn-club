import type { z } from 'zod'
import {
  emergencyContactSchema,
  gearProfileSchema,
  interestsPreferencesSchema,
  notificationSettingsSchema,
  privacySettingsSchema,
  skillsCertsSchema,
  travelProfileSchema,
} from '@/lib/profile/schemas'
import type {
  EmergencyContact,
  GearProfile,
  InterestsPreferences,
  NotificationSettings,
  PrivacySettings,
  ProfileFormValues,
  ProfileRow,
  ProfileUpdate,
  SkillsCerts,
  TravelProfile,
} from '@/lib/profile/types'
import type { Json } from '@/lib/supabase/types'

const emptyEmergencyContact: EmergencyContact = {
  name: '',
  relationship: '',
  phone: '',
  notes: '',
}

const emptyPrivacySettings: PrivacySettings = {
  shareEmail: false,
  sharePhone: false,
  profileVisible: true,
  shareGear: true,
  shareCarpooling: true,
  shareCarInfo: false,
  shareNeighborhood: true,
}

const emptyTravelProfile: TravelProfile = {
  hasCar: false,
  seats: '',
  departureCity: '',
  willingToDrive: false,
}

const emptyGearProfile: GearProfile = {
  gearOwned: '',
  gearNeeded: '',
}

const emptySkillsCerts: SkillsCerts = {
  skills: '',
  certifications: '',
}

const emptyInterestsPreferences: InterestsPreferences = {
  interests: '',
  preferredActivities: '',
  availability: '',
}

const emptyNotificationSettings: NotificationSettings = {
  email: true,
  sms: false,
  announcements: true,
  tripUpdates: true,
  memberStories: true,
  safetyAlerts: true,
  digestFrequency: 'weekly',
}

export const emptyProfileValues = (): ProfileFormValues => ({
  displayName: '',
  username: '',
  avatarUrl: '',
  bio: '',
  pronouns: '',
  phone: '',
  emergencyContact: { ...emptyEmergencyContact },
  privacySettings: { ...emptyPrivacySettings },
  travelProfile: { ...emptyTravelProfile },
  gearProfile: { ...emptyGearProfile },
  skillsCerts: { ...emptySkillsCerts },
  interestsPreferences: { ...emptyInterestsPreferences },
  notificationSettings: { ...emptyNotificationSettings },
})

function parseSection<T extends Record<string, unknown>>(
  value: Json | null | undefined,
  schema: z.ZodType<Partial<T>>,
  fallback: T,
): T {
  if (!value) return { ...fallback }
  const parsed = schema.safeParse(value)
  if (!parsed.success) return { ...fallback }
  return { ...fallback, ...parsed.data }
}

export function profileRowToFormValues(
  profile: ProfileRow | null,
): ProfileFormValues {
  if (!profile) {
    return emptyProfileValues()
  }

  return {
    displayName: profile.display_name ?? '',
    username: profile.username ?? '',
    avatarUrl: profile.avatar_url ?? '',
    bio: profile.bio ?? '',
    pronouns: profile.pronouns ?? '',
    phone: profile.phone ?? '',
    emergencyContact: parseSection(
      profile.emergency_contact,
      emergencyContactSchema,
      emptyEmergencyContact,
    ),
    privacySettings: parseSection(
      profile.privacy_settings,
      privacySettingsSchema,
      emptyPrivacySettings,
    ),
    travelProfile: parseSection(
      profile.travel_profile,
      travelProfileSchema,
      emptyTravelProfile,
    ),
    gearProfile: parseSection(
      profile.gear_profile,
      gearProfileSchema,
      emptyGearProfile,
    ),
    skillsCerts: parseSection(
      profile.skills_certs,
      skillsCertsSchema,
      emptySkillsCerts,
    ),
    interestsPreferences: parseSection(
      profile.interests_preferences,
      interestsPreferencesSchema,
      emptyInterestsPreferences,
    ),
    notificationSettings: parseSection(
      profile.notification_settings,
      notificationSettingsSchema,
      emptyNotificationSettings,
    ),
  }
}

const normalizeString = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const isMeaningful = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  return value !== null && value !== undefined
}

const normalizeSection = (section: Record<string, unknown>): Json | null => {
  const entries = Object.entries(section)
    .map<[string, unknown]>(([key, value]) => {
      if (typeof value === 'string') {
        const normalized = normalizeString(value)
        return [key, normalized]
      }
      return [key, value]
    })
    .filter(([, value]) => value !== null && value !== undefined)

  if (!entries.some(([, value]) => isMeaningful(value))) {
    return null
  }

  return Object.fromEntries(entries) as Json
}

export function profileFormToUpdate(values: ProfileFormValues): ProfileUpdate {
  return {
    display_name: normalizeString(values.displayName),
    username: normalizeString(values.username),
    avatar_url: normalizeString(values.avatarUrl),
    bio: normalizeString(values.bio),
    pronouns: normalizeString(values.pronouns),
    phone: normalizeString(values.phone),
    emergency_contact: normalizeSection(values.emergencyContact),
    privacy_settings: normalizeSection(values.privacySettings),
    travel_profile: normalizeSection(values.travelProfile),
    gear_profile: normalizeSection(values.gearProfile),
    skills_certs: normalizeSection(values.skillsCerts),
    interests_preferences: normalizeSection(values.interestsPreferences),
    notification_settings: normalizeSection(values.notificationSettings),
    updated_at: new Date().toISOString(),
  }
}
