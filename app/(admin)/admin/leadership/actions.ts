'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const uuidSchema = z.string().uuid()

export async function setRoleCapabilityAction(formData: FormData) {
  const context = await requireAdminCapability('leadership.read')
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const roleId = uuidSchema.parse(String(formData.get('roleId') ?? ''))
  const capabilityKey = z
    .string()
    .min(3)
    .parse(String(formData.get('capabilityKey') ?? ''))
  const scope = z
    .enum(['none', 'assigned', 'all'])
    .parse(String(formData.get('scope') ?? ''))
  const admin = createAdminClient()
  const [role, capability] = await Promise.all([
    admin
      .from('admin_roles')
      .select('is_super_admin')
      .eq('id', roleId)
      .single(),
    admin
      .from('admin_capabilities')
      .select('supports_assigned_scope, is_active')
      .eq('key', capabilityKey)
      .single(),
  ])
  if (role.error) throw role.error
  if (capability.error) throw capability.error
  if (role.data.is_super_admin)
    throw new Error('Super-admin capabilities are immutable.')
  if (!capability.data.is_active)
    throw new Error('Inactive capabilities cannot be granted yet.')
  if (scope === 'assigned' && !capability.data.supports_assigned_scope) {
    throw new Error('This capability does not support assigned-only access.')
  }
  const result =
    scope === 'none'
      ? await admin
          .from('admin_role_grants')
          .delete()
          .eq('role_id', roleId)
          .eq('capability_key', capabilityKey)
      : await admin.from('admin_role_grants').upsert(
          {
            role_id: roleId,
            capability_key: capabilityKey,
            scope,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'role_id,capability_key' },
        )
  if (result.error) throw result.error
  await admin.rpc('record_admin_activity', {
    p_actor_user_id: context.userId,
    p_subject_user_id: null,
    p_action: 'role_capability_updated',
    p_resource_type: 'admin_role',
    p_resource_id: roleId,
    p_summary: `Role capability ${capabilityKey} changed to ${scope}.`,
    p_before_data: null,
    p_after_data: { capability: capabilityKey, scope },
    p_result: 'succeeded',
  })
  revalidatePath('/admin/leadership')
}

export async function saveRosterEntryAction(formData: FormData) {
  const context = await requireAdminCapability('leadership.read')
  if (!context.isSuperAdmin) throw new Error('Super admin access required.')
  const rawId = String(formData.get('hostId') ?? '')
  const hostId = rawId ? uuidSchema.parse(rawId) : null
  const publicName = z
    .string()
    .trim()
    .min(2)
    .max(120)
    .parse(formData.get('publicName'))
  const roleKey = z
    .string()
    .trim()
    .min(2)
    .max(80)
    .parse(formData.get('roleKey'))
  const title = z.string().trim().min(2).max(120).parse(formData.get('title'))
  const displayOrder = z.coerce
    .number()
    .int()
    .min(0)
    .max(1000)
    .parse(formData.get('displayOrder'))
  const linkedUserRaw = String(formData.get('linkedUserId') ?? '')
  const linkedUserId = linkedUserRaw ? uuidSchema.parse(linkedUserRaw) : null
  const isActive = formData.get('isActive') === 'on'
  const admin = createAdminClient()
  const payload = {
    public_name: publicName,
    club_title: title,
    role_key: roleKey,
    display_order: displayOrder,
    linked_user_id: linkedUserId,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }
  const result = hostId
    ? await admin.from('club_hosts').update(payload).eq('id', hostId)
    : await admin.from('club_hosts').insert(payload)
  if (result.error) throw result.error

  if (linkedUserId) {
    const roleResult = await admin
      .from('admin_roles')
      .select('id')
      .eq('key', roleKey)
      .maybeSingle()
    if (roleResult.data) {
      await admin.from('admin_user_roles').upsert(
        {
          user_id: linkedUserId,
          role_id: roleResult.data.id,
          assigned_by: context.userId,
        },
        { onConflict: 'user_id,role_id' },
      )
    }
  }
  await admin.rpc('record_admin_activity', {
    p_actor_user_id: context.userId,
    p_subject_user_id: linkedUserId,
    p_action: hostId
      ? 'leadership_roster_updated'
      : 'leadership_roster_created',
    p_resource_type: 'club_host',
    p_resource_id: hostId,
    p_summary: `${publicName}'s leadership roster entry was saved.`,
    p_before_data: null,
    p_after_data: { role: roleKey, active: isActive },
    p_result: 'succeeded',
  })
  revalidatePath('/admin/leadership')
  revalidatePath('/team')
}
