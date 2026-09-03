'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const uuidSchema = z.string().uuid()

async function logAccountAction(
  actorId: string,
  subjectId: string,
  action: string,
  summary: string,
  result: 'succeeded' | 'failed' = 'succeeded',
) {
  const admin = createAdminClient()
  const { error } = await admin.rpc('record_admin_activity', {
    p_actor_user_id: actorId,
    p_subject_user_id: subjectId,
    p_action: action,
    p_resource_type: 'account',
    p_resource_id: subjectId,
    p_summary: summary,
    p_before_data: null,
    p_after_data: null,
    p_result: result,
  })
  if (error) console.error('Unable to record account audit event:', error)
}

const isMissingAuthIdentity = (error: unknown) =>
  Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 404,
  )

async function markDeletionFailed({
  actorId,
  userId,
  jobId,
  message,
}: {
  actorId: string
  userId: string
  jobId: string
  message: string
}) {
  const admin = createAdminClient()
  await admin
    .from('account_deletion_jobs')
    .update({
      status: 'failed',
      last_error: message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
  await logAccountAction(
    actorId,
    userId,
    'account_deletion_failed',
    'Account deletion requires another cleanup attempt.',
    'failed',
  )
}

async function processAccountDeletionJob({
  actorId,
  userId,
  jobId,
  status,
}: {
  actorId: string
  userId: string
  jobId: string
  status: string
}) {
  const admin = createAdminClient()
  if (status !== 'auth_deleted') {
    const deleted = await admin.auth.admin.deleteUser(userId, true)
    if (deleted.error && !isMissingAuthIdentity(deleted.error)) {
      await markDeletionFailed({
        actorId,
        userId,
        jobId,
        message: deleted.error.message,
      })
      throw deleted.error
    }
    const authDeleted = await admin
      .from('account_deletion_jobs')
      .update({
        status: 'auth_deleted',
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
    if (authDeleted.error) throw authDeleted.error
  }

  const tombstoneEmail = `deleted+${userId}@invalid.local`
  const cleanupResults = await Promise.all([
    admin
      .from('profiles')
      .update({
        display_name: 'Deleted member',
        first_name: null,
        last_name: null,
        username: null,
        avatar_url: null,
        bio: null,
        pronouns: null,
      })
      .eq('user_id', userId),
    admin
      .from('profile_private')
      .update({
        phone: null,
        birthday: null,
        emergency_contact: null,
        carpool_profile: null,
        gear_profile: null,
        privacy_settings: null,
        travel_profile: null,
        skills_certs: null,
        interests_preferences: null,
        notification_settings: null,
      })
      .eq('user_id', userId),
    admin
      .from('membership_applications')
      .update({
        full_name: 'Deleted member',
        contact_email: tombstoneEmail,
        experience_notes: null,
      })
      .eq('user_id', userId),
    admin.from('mailing_list_subscriptions').delete().eq('user_id', userId),
    admin.from('mailing_list_consent_events').delete().eq('user_id', userId),
    admin.from('admin_user_roles').delete().eq('user_id', userId),
    admin
      .from('club_hosts')
      .update({ linked_user_id: null })
      .eq('linked_user_id', userId),
  ])
  const cleanupError = cleanupResults.find(result => result.error)?.error
  if (cleanupError) {
    await markDeletionFailed({
      actorId,
      userId,
      jobId,
      message: cleanupError.message,
    })
    throw cleanupError
  }

  const completed = await admin
    .from('account_deletion_jobs')
    .update({
      status: 'completed',
      last_error: null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
  if (completed.error) throw completed.error
  await logAccountAction(
    actorId,
    userId,
    'account_deleted',
    'Account login and personal data were permanently removed.',
  )
}

export async function setAccountRestrictionAction(formData: FormData) {
  const context = await requireAdminCapability('accounts.update')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  const restriction = z
    .enum(['normal', 'suspended', 'banned'])
    .parse(String(formData.get('restriction') ?? ''))
  const reason = String(formData.get('reason') ?? '').trim()
  const admin = createAdminClient()
  const { error } = await admin.rpc('set_admin_account_restriction', {
    p_actor_user_id: context.userId,
    p_user_id: userId,
    p_restriction: restriction,
    p_reason: reason || null,
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
  revalidatePath(`/admin/accounts/${userId}`)
}

export async function grantMembershipAccessAction(formData: FormData) {
  const context = await requireAdminCapability('membership.update')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  const days = z.coerce
    .number()
    .int()
    .min(1)
    .max(730)
    .parse(formData.get('days'))
  const reason = z.string().trim().min(3).max(500).parse(formData.get('reason'))
  const admin = createAdminClient()
  const { error } = await admin.rpc('grant_complimentary_membership_access', {
    p_actor_user_id: context.userId,
    p_user_id: userId,
    p_days: days,
    p_reason: reason,
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
  revalidatePath(`/admin/accounts/${userId}`)
}

export async function assignLeadershipRoleAction(formData: FormData) {
  const context = await requireAdminCapability('leadership.read')
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  const roleId = uuidSchema.parse(String(formData.get('roleId') ?? ''))
  const admin = createAdminClient()
  const { error } = await admin
    .from('admin_user_roles')
    .upsert(
      { user_id: userId, role_id: roleId, assigned_by: context.userId },
      { onConflict: 'user_id,role_id' },
    )
  if (error) throw error
  await logAccountAction(
    context.userId,
    userId,
    'leadership_role_assigned',
    'Leadership role assigned.',
  )
  revalidatePath('/admin/accounts')
  revalidatePath('/admin/leadership')
  revalidatePath(`/admin/accounts/${userId}`)
}

export async function removeLeadershipRoleAction(formData: FormData) {
  const context = await requireAdminCapability('leadership.read')
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  const roleId = uuidSchema.parse(String(formData.get('roleId') ?? ''))
  const admin = createAdminClient()
  const role = await admin
    .from('admin_roles')
    .select('is_super_admin')
    .eq('id', roleId)
    .single()
  if (role.error) throw role.error
  if (role.data.is_super_admin)
    throw new Error('Use the protected super-admin process.')
  const { error } = await admin
    .from('admin_user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId)
  if (error) throw error
  await logAccountAction(
    context.userId,
    userId,
    'leadership_role_removed',
    'Leadership role removed.',
  )
  revalidatePath('/admin/accounts')
  revalidatePath('/admin/leadership')
  revalidatePath(`/admin/accounts/${userId}`)
}

export async function setSuperAdminAction(formData: FormData) {
  const context = await requireAdminCapability('accounts.update')
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  const operation = z
    .enum(['assign', 'remove'])
    .parse(String(formData.get('operation') ?? ''))
  const admin = createAdminClient()
  const { error } = await admin.rpc('set_super_admin_assignment', {
    p_actor_user_id: context.userId,
    p_target_user_id: userId,
    p_assign: operation === 'assign',
  })
  if (error) throw error
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
  revalidatePath(`/admin/accounts/${userId}`)
}

export async function sendPasswordResetAction(formData: FormData) {
  const context = await requireAdminCapability('accounts.update')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  const email = z
    .string()
    .email()
    .parse(String(formData.get('email') ?? ''))
  const admin = createAdminClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://unlvmountainclub.com'
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/update-password`,
  })
  if (error) throw error
  await logAccountAction(
    context.userId,
    userId,
    'password_reset_sent',
    'Password reset assistance was sent.',
  )
  revalidatePath(`/admin/accounts/${userId}`)
}

export async function permanentlyDeleteAccountAction(formData: FormData) {
  const context = await requireAdminCapability('accounts.update')
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  if (userId === context.userId)
    throw new Error('You cannot delete your own account.')
  const confirmation = String(formData.get('confirmation') ?? '')
    .trim()
    .toLowerCase()
  const admin = createAdminClient()
  const [userResult, superRoles] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from('admin_user_roles')
      .select('role_id, admin_roles(is_super_admin)')
      .eq('user_id', userId),
  ])
  if (userResult.error || !userResult.data.user)
    throw userResult.error ?? new Error('Account not found.')
  const email = userResult.data.user.email?.toLowerCase()
  if (!email || confirmation !== email)
    throw new Error('Type the account email exactly to confirm deletion.')
  if ((superRoles.data ?? []).some(item => item.admin_roles?.is_super_admin)) {
    throw new Error('Remove super-admin access before deleting this account.')
  }

  const job = await admin
    .from('account_deletion_jobs')
    .upsert(
      {
        user_id: userId,
        requested_by: context.userId,
        status: 'pending',
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('id')
    .single()
  if (job.error) throw job.error

  await admin.from('membership_account_restrictions').upsert(
    {
      user_id: userId,
      restriction: 'banned',
      internal_reason: 'Account deletion in progress.',
      restricted_at: new Date().toISOString(),
      updated_by: context.userId,
    },
    { onConflict: 'user_id' },
  )
  await processAccountDeletionJob({
    actorId: context.userId,
    userId,
    jobId: job.data.id,
    status: 'pending',
  })
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
}

export async function retryAccountDeletionAction(formData: FormData) {
  const context = await requireAdminCapability('accounts.update')
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const userId = uuidSchema.parse(String(formData.get('userId') ?? ''))
  if (userId === context.userId)
    throw new Error('You cannot delete your own account.')
  const admin = createAdminClient()
  const [job, superRoles] = await Promise.all([
    admin
      .from('account_deletion_jobs')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', ['pending', 'auth_deleted', 'failed'])
      .single(),
    admin
      .from('admin_user_roles')
      .select('role_id, admin_roles(is_super_admin)')
      .eq('user_id', userId),
  ])
  if (job.error) throw job.error
  if (superRoles.error) throw superRoles.error
  if ((superRoles.data ?? []).some(item => item.admin_roles?.is_super_admin)) {
    throw new Error('Super-admin accounts cannot be deleted.')
  }

  await processAccountDeletionJob({
    actorId: context.userId,
    userId,
    jobId: job.data.id,
    status: job.data.status,
  })
  revalidatePath('/admin')
  revalidatePath('/admin/accounts')
}
