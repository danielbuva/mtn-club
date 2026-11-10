import 'server-only'

import { type AdminContext, getAdminContext } from '@/lib/admin/auth'
import type { PageEditAccess } from '@/lib/admin/site-pages'
import { createClient } from '@/lib/supabase/server'

/** What an admin's role lets them do in each page editor. */
export function pageEditAccess(
  context: Pick<AdminContext, 'permissions' | 'isSuperAdmin'>,
): PageEditAccess {
  const { permissions, isSuperAdmin } = context
  const level = (canEdit: boolean, canRead: boolean) =>
    canEdit ? 'edit' : canRead ? 'view' : 'none'
  return {
    trips:
      permissions['trips.update'] === 'assigned'
        ? 'assigned'
        : level(
            Boolean(permissions['trips.update']),
            Boolean(permissions['trips.read']),
          ),
    notices: level(
      Boolean(permissions['announcements.manage']),
      Boolean(permissions['announcements.read']),
    ),
    gallery: level(
      Boolean(permissions['gallery.update'] ?? permissions['gallery.create']),
      Boolean(permissions['gallery.read']),
    ),
    roster: level(isSuperAdmin, Boolean(permissions['leadership.read'])),
  }
}

/**
 * Page-editing access for whoever is looking at a public page. Members and
 * signed-out visitors cost one query at most and get null.
 */
export type ViewerPageEditAccess = {
  access: PageEditAccess
  /** Trips this admin leads; only filled when their trip access is `assigned`. */
  ledTripIds: string[]
}

export async function getLedTripIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trip_leaders')
    .select('trip_id')
    .eq('user_id', userId)
  return (data ?? []).map(row => row.trip_id)
}

export async function getViewerPageEditAccess(): Promise<ViewerPageEditAccess | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  const admin = await supabase.rpc('has_admin_capability', {
    p_uid: data.user.id,
    p_capability_key: 'overview.read',
  })
  if (admin.error || !admin.data) return null
  const context = await getAdminContext()
  if (!context) return null
  const access = pageEditAccess(context)
  return {
    access,
    ledTripIds:
      access.trips === 'assigned' ? await getLedTripIds(context.userId) : [],
  }
}
