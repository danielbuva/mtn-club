'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  type RegistrationResult,
  registrationInputSchema,
  settingsInputSchema,
  snapshotSchema,
} from '@/lib/registration/schema'
import { getRegistration } from '@/lib/registration/server'
import { createClient } from '@/lib/supabase/server'

function refreshRegistration(tripId: string) {
  for (const path of [
    '/trips',
    `/trips/${tripId}`,
    `/trips/${tripId}/rsvp`,
    `/trips/${tripId}/registrations`,
    '/profile/trips',
    '/calendar',
    `/admin/trips/${tripId}/registrations`,
    '/admin/membership/trip-guardian-reviews',
  ])
    revalidatePath(path)
}
export async function loadRsvpChoicesAction(tripId: string) {
  return getRegistration(tripId)
}
export async function registrationAction(
  input: unknown,
): Promise<RegistrationResult> {
  const parsed = registrationInputSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      message: 'Check your registration details.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  const { tripId, command, requestId, expectedRevision, userId, data } =
    parsed.data
  const db = await createClient()
  const result = await db.rpc('registration_command', {
    p_trip_id: tripId,
    p_command: command,
    p_request_id: requestId,
    p_expected_revision: expectedRevision,
    p_data: data,
    ...(userId ? { p_user_id: userId } : {}),
  })
  if (result.error) {
    const current = await getRegistration(tripId).catch(() => undefined)
    return {
      ok: false,
      message:
        result.error.code === 'P0001'
          ? result.error.message
          : 'Registration could not be saved. Refresh and try again.',
      snapshot: current,
    }
  }
  refreshRegistration(tripId)
  return { ok: true, snapshot: snapshotSchema.parse(result.data) }
}
export async function declareAgeAction(adult: boolean) {
  const db = await createClient()
  const { error } = await db.rpc('declare_registration_age', {
    p_adult: z.boolean().parse(adult),
  })
  return error
    ? {
        ok: false,
        message:
          error.code === 'P0001'
            ? error.message
            : 'Age declaration could not be saved.',
      }
    : { ok: true }
}
export async function saveRegistrationSettingsAction(
  tripId: string,
  revision: number,
  input: unknown,
) {
  const parsed = settingsInputSchema.safeParse(input)
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Check the settings.',
    }
  const db = await createClient()
  const { error } = await db.rpc('save_registration_settings', {
    p_trip_id: z.string().uuid().parse(tripId),
    p_revision: z.number().int().parse(revision),
    p_data: parsed.data,
  })
  if (error)
    return {
      ok: false,
      message:
        error.code === 'P0001' ? error.message : 'Settings could not be saved.',
    }
  refreshRegistration(tripId)
  return { ok: true, message: 'Registration settings saved.' }
}
export async function setRegistrationEnabledAction(enabled: boolean) {
  const db = await createClient()
  const { error } = await db.rpc('set_registration_enabled', {
    p_enabled: z.boolean().parse(enabled),
  })
  if (error)
    return {
      ok: false,
      message:
        'Registration switch could not be changed. Check your settings permission.',
    }
  revalidatePath('/admin/registration')
  revalidatePath('/trips', 'layout')
  return {
    ok: true,
    message: enabled ? 'New registration enabled.' : 'New registration paused.',
  }
}
