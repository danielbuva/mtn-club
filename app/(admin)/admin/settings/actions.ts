'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const settingsSchema = z.object({
  termId: z.string().uuid(),
  termName: z.string().trim().min(3).max(80),
  startsOn: z.iso.date(),
  endsOn: z.iso.date(),
  duesAmount: z.coerce.number().positive().max(1000),
  timeZone: z.string().trim().min(3).max(80),
  unofficialTripLimit: z.coerce.number().int().min(0).max(20),
})

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export async function updateAdminSettingsAction(formData: FormData) {
  const context = await requireAdminCapability('settings.update')
  const values = settingsSchema.parse({
    termId: formData.get('termId'),
    termName: formData.get('termName'),
    startsOn: formData.get('startsOn'),
    endsOn: formData.get('endsOn'),
    duesAmount: formData.get('duesAmount'),
    timeZone: formData.get('timeZone'),
    unofficialTripLimit: formData.get('unofficialTripLimit'),
  })
  if (values.endsOn < values.startsOn) {
    throw new Error('The club term must end on or after its start date.')
  }
  if (!isValidTimeZone(values.timeZone)) {
    throw new Error(
      'Enter a valid IANA time zone, such as America/Los_Angeles.',
    )
  }

  const admin = createAdminClient()
  const before = await admin
    .from('club_admin_settings')
    .select('dues_amount_cents, time_zone, non_admin_upcoming_trip_limit')
    .eq('id', true)
    .single()
  if (before.error) throw before.error

  const [termUpdate, settingsUpdate] = await Promise.all([
    admin
      .from('club_terms')
      .update({
        name: values.termName,
        starts_on: values.startsOn,
        ends_on: values.endsOn,
        updated_at: new Date().toISOString(),
      })
      .eq('id', values.termId),
    admin
      .from('club_admin_settings')
      .update({
        dues_amount_cents: Math.round(values.duesAmount * 100),
        time_zone: values.timeZone,
        non_admin_upcoming_trip_limit: values.unofficialTripLimit,
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', true),
  ])
  if (termUpdate.error) throw termUpdate.error
  if (settingsUpdate.error) throw settingsUpdate.error

  const { error: auditError } = await admin.rpc('record_admin_activity', {
    p_actor_user_id: context.userId,
    p_subject_user_id: null,
    p_action: 'settings_updated',
    p_resource_type: 'club_settings',
    p_resource_id: values.termId,
    p_summary: `Updated ${values.termName} operating settings.`,
    p_before_data: before.data,
    p_after_data: {
      dues_amount_cents: Math.round(values.duesAmount * 100),
      time_zone: values.timeZone,
      non_admin_upcoming_trip_limit: values.unofficialTripLimit,
    },
    p_result: 'succeeded',
  })
  if (auditError)
    console.error('Unable to record settings audit event:', auditError)
  revalidatePath('/admin')
  revalidatePath('/admin/settings')
}
