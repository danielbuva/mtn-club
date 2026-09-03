'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminCapability } from '@/lib/admin/auth'
import type { AdminCapability } from '@/lib/admin/constants'
import { createAdminClient } from '@/lib/supabase/admin'

const tripIdSchema = z.string().uuid()

async function requireTripCapability(
  capability: AdminCapability,
  tripId: string,
) {
  const context = await requireAdminCapability(capability)
  if (context.permissions[capability] === 'assigned') {
    const admin = createAdminClient()
    const assignment = await admin
      .from('trip_leaders')
      .select('trip_id')
      .eq('trip_id', tripId)
      .eq('user_id', context.userId)
      .maybeSingle()
    if (assignment.error) throw assignment.error
    if (!assignment.data) throw new Error('This trip is not assigned to you.')
  }
  return context
}

async function logTripAction(
  actorId: string,
  tripId: string,
  action: string,
  summary: string,
) {
  const admin = createAdminClient()
  const { error } = await admin.rpc('record_admin_activity', {
    p_actor_user_id: actorId,
    p_subject_user_id: null,
    p_action: action,
    p_resource_type: 'trip',
    p_resource_id: tripId,
    p_summary: summary,
    p_before_data: null,
    p_after_data: null,
    p_result: 'succeeded',
  })
  if (error) console.error('Unable to record trip audit event:', error)
}

export async function setTripOfficialAction(formData: FormData) {
  const tripId = tripIdSchema.parse(String(formData.get('tripId') ?? ''))
  const context = await requireTripCapability('trips.official', tripId)
  const isOfficial = String(formData.get('isOfficial')) === 'true'
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('trips')
    .update({ is_official: isOfficial, updated_at: new Date().toISOString() })
    .eq('id', tripId)
    .select('title')
    .single()
  if (error) throw error
  await logTripAction(
    context.userId,
    tripId,
    isOfficial ? 'trip_made_official' : 'trip_made_unofficial',
    `${data.title} was marked ${isOfficial ? 'official' : 'unofficial'}.`,
  )
  revalidatePath('/admin')
  revalidatePath('/admin/trips')
  revalidatePath('/trips')
  revalidatePath(`/trips/${tripId}`)
}

export async function changeTripLifecycleAction(formData: FormData) {
  const tripId = tripIdSchema.parse(String(formData.get('tripId') ?? ''))
  const context = await requireTripCapability('trips.delete', tripId)
  const lifecycle = z
    .enum(['canceled', 'archived', 'published'])
    .parse(String(formData.get('lifecycle')))
  const now = new Date().toISOString()
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('trips')
    .update({
      lifecycle_status: lifecycle,
      canceled_at: lifecycle === 'canceled' ? now : null,
      canceled_by: lifecycle === 'canceled' ? context.userId : null,
      archived_at: lifecycle === 'archived' ? now : null,
      updated_at: now,
    })
    .eq('id', tripId)
    .select('title')
    .single()
  if (error) throw error
  await logTripAction(
    context.userId,
    tripId,
    `trip_${lifecycle}`,
    `${data.title} was ${lifecycle}.`,
  )
  revalidatePath('/admin')
  revalidatePath('/admin/trips')
  revalidatePath('/trips')
  revalidatePath('/calendar')
  revalidatePath(`/trips/${tripId}`)
}

export async function purgeTestTripAction(formData: FormData) {
  const tripId = tripIdSchema.parse(String(formData.get('tripId') ?? ''))
  const context = await requireTripCapability('trips.delete', tripId)
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const admin = createAdminClient()
  const [trip, rsvps, attendance, carpools, comments] = await Promise.all([
    admin
      .from('trips')
      .select('title, lifecycle_status')
      .eq('id', tripId)
      .single(),
    admin
      .from('trip_rsvps')
      .select('trip_id', { count: 'exact', head: true })
      .eq('trip_id', tripId),
    admin
      .from('trip_attendance')
      .select('trip_id', { count: 'exact', head: true })
      .eq('trip_id', tripId),
    admin
      .from('trip_carpools')
      .select('trip_id', { count: 'exact', head: true })
      .eq('trip_id', tripId),
    admin
      .from('trip_comments')
      .select('trip_id', { count: 'exact', head: true })
      .eq('trip_id', tripId),
  ])
  if (trip.error) throw trip.error
  if (
    trip.data.lifecycle_status === 'published' ||
    !/test/i.test(trip.data.title)
  ) {
    throw new Error(
      'Only canceled or archived trips clearly labeled as tests may be purged.',
    )
  }
  if ([rsvps, attendance, carpools, comments].some(result => result.error)) {
    throw new Error('Trip history could not be checked safely.')
  }
  if (
    [rsvps, attendance, carpools, comments].some(
      result => (result.count ?? 0) > 0,
    )
  ) {
    throw new Error('Trips with member history cannot be purged.')
  }
  const { error } = await admin.from('trips').delete().eq('id', tripId)
  if (error) throw error
  await logTripAction(
    context.userId,
    tripId,
    'trip_purged',
    `${trip.data.title} was permanently purged.`,
  )
  revalidatePath('/admin')
  revalidatePath('/admin/trips')
  revalidatePath('/trips')
}
