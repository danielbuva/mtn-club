import { z } from 'zod'

export const emergencyContactSchema = z
  .object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  })
  .partial()

export const privacySettingsSchema = z
  .object({
    shareEmail: z.boolean().optional(),
    sharePhone: z.boolean().optional(),
    profileVisible: z.boolean().optional(),
    shareGear: z.boolean().optional(),
    shareCarpooling: z.boolean().optional(),
    shareCarInfo: z.boolean().optional(),
    shareNeighborhood: z.boolean().optional(),
  })
  .partial()

export const travelProfileSchema = z
  .object({
    hasCar: z.boolean().optional(),
    seats: z.string().optional(),
    departureCity: z.string().optional(),
    willingToDrive: z.boolean().optional(),
  })
  .partial()

export const gearProfileSchema = z
  .object({
    gearOwned: z.string().optional(),
    gearNeeded: z.string().optional(),
  })
  .partial()

export const skillsCertsSchema = z
  .object({
    skills: z.string().optional(),
    certifications: z.string().optional(),
  })
  .partial()

export const interestsPreferencesSchema = z
  .object({
    interests: z.string().optional(),
    preferredActivities: z.string().optional(),
    availability: z.string().optional(),
  })
  .partial()

export const notificationSettingsSchema = z
  .object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    announcements: z.boolean().optional(),
    tripUpdates: z.boolean().optional(),
    memberStories: z.boolean().optional(),
    safetyAlerts: z.boolean().optional(),
    digestFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  })
  .partial()

export const profileFormSchema = z.object({
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string(),
  bio: z.string(),
  pronouns: z.string(),
  phone: z.string(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
    notes: z.string(),
  }),
  privacySettings: z.object({
    shareEmail: z.boolean(),
    sharePhone: z.boolean(),
    profileVisible: z.boolean(),
    shareGear: z.boolean(),
    shareCarpooling: z.boolean(),
    shareCarInfo: z.boolean(),
    shareNeighborhood: z.boolean(),
  }),
  travelProfile: z.object({
    hasCar: z.boolean(),
    seats: z.string(),
    departureCity: z.string(),
    willingToDrive: z.boolean(),
  }),
  gearProfile: z.object({
    gearOwned: z.string(),
    gearNeeded: z.string(),
  }),
  skillsCerts: z.object({
    skills: z.string(),
    certifications: z.string(),
  }),
  interestsPreferences: z.object({
    interests: z.string(),
    preferredActivities: z.string(),
    availability: z.string(),
  }),
  notificationSettings: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    announcements: z.boolean(),
    tripUpdates: z.boolean(),
    memberStories: z.boolean(),
    safetyAlerts: z.boolean(),
    digestFrequency: z.enum(['daily', 'weekly', 'monthly']),
  }),
})

export type ProfileFormInput = z.infer<typeof profileFormSchema>
