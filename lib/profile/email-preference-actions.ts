'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { emailPreferencesSchema } from '@/lib/profile/email-preferences'
import { privacySettingsSchema } from '@/lib/profile/schemas'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z
  .object({
    privacy: privacySettingsSchema.strict(),
    preferences: emailPreferencesSchema,
    expected: emailPreferencesSchema,
  })
  .strict()
export async function savePrivacyEmailPreferences(input: unknown) {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false as const,
      message: 'Check the privacy and email choices, then try again.',
    }
  const db = await createClient()
  const { data, error } = await db.rpc('save_privacy_email_preferences', {
    p_privacy: parsed.data.privacy,
    p_preferences: parsed.data.preferences,
    p_expected: parsed.data.expected,
  })
  if (error)
    return {
      ok: false as const,
      message:
        error.code === 'P0001'
          ? error.message
          : 'Preferences could not be saved. Please try again.',
    }
  revalidatePath('/profile/user/privacy')
  revalidatePath('/profile/trips')
  revalidatePath('/trips', 'layout')
  return { ok: true as const, preferences: emailPreferencesSchema.parse(data) }
}
