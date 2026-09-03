import 'server-only'

import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'
import { ADMIN_CAPABILITIES, type AdminCapability } from '@/lib/admin/constants'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export type AdminPermissionMap = Partial<
  Record<AdminCapability, Database['public']['Enums']['admin_permission_scope']>
>

export type AdminContext = {
  userId: string
  email: string | null
  displayName: string
  isSuperAdmin: boolean
  permissions: AdminPermissionMap
  roleNames: string[]
}

type AdminContextResult =
  | { status: 'authorized'; context: AdminContext }
  | { status: 'unauthenticated' }
  | { status: 'forbidden' }
  | { status: 'unavailable' }

const readRoleNames = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(readRoleNames)
  if (!value || typeof value !== 'object' || !('name' in value)) return []
  return typeof value.name === 'string' ? [value.name] : []
}

const resolveAdminContext = cache(async (): Promise<AdminContextResult> => {
  await connection()
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) return { status: 'unauthenticated' }

  const user = authData.user
  const [profileResult, superResult, assignmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.rpc('is_super_admin', { p_uid: user.id }),
    supabase
      .from('admin_user_roles')
      .select('role_id, admin_roles(name)')
      .eq('user_id', user.id),
  ])

  if (superResult.error || assignmentsResult.error) {
    return { status: 'unavailable' }
  }

  const scopeResults = superResult.data
    ? []
    : await Promise.all(
        ADMIN_CAPABILITIES.map(capability =>
          supabase.rpc('admin_capability_scope', {
            p_uid: user.id,
            p_capability_key: capability,
          }),
        ),
      )

  const authorizationUnavailable = Boolean(
    scopeResults.some(result => result.error),
  )
  if (authorizationUnavailable) return { status: 'unavailable' }

  const permissions: AdminPermissionMap = {}
  if (superResult.data) {
    for (const capability of ADMIN_CAPABILITIES) {
      permissions[capability] = 'all'
    }
  } else {
    ADMIN_CAPABILITIES.forEach((capability, index) => {
      const scope = scopeResults[index]?.data
      if (scope === 'all' || scope === 'assigned') {
        permissions[capability] = scope
      }
    })
  }

  if (!permissions['overview.read']) return { status: 'forbidden' }

  const roleNames = (assignmentsResult.data ?? [])
    .flatMap(assignment => readRoleNames(assignment.admin_roles))
    .filter((name): name is string => Boolean(name))

  return {
    status: 'authorized',
    context: {
      userId: user.id,
      email: user.email ?? null,
      displayName:
        profileResult.data?.display_name ??
        user.email?.split('@')[0] ??
        'Admin',
      isSuperAdmin: superResult.data ?? false,
      permissions,
      roleNames,
    },
  }
})

export async function getAdminContext(): Promise<AdminContext | null> {
  const result = await resolveAdminContext()
  return result.status === 'authorized' ? result.context : null
}

export async function requireAdmin(): Promise<AdminContext> {
  const result = await resolveAdminContext()
  if (result.status === 'unauthenticated') {
    redirect('/auth/login?returnTo=%2Fadmin')
  }
  if (result.status === 'unavailable') {
    redirect('/auth/admin-access?reason=setup')
  }
  if (result.status === 'forbidden') {
    redirect('/auth/admin-access?reason=forbidden')
  }
  return result.context
}

export async function requireAdminCapability(
  capability: AdminCapability,
): Promise<AdminContext> {
  const context = await requireAdmin()
  if (!context.permissions[capability]) {
    throw new Error('You do not have permission to perform this action.')
  }
  return context
}
