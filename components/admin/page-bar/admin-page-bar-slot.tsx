import { connection } from 'next/server'
import { getViewerPageEditAccess } from '@/lib/admin/page-access'
import { AdminPageBar } from './admin-page-bar'

/** Renders the admin strip above public pages, and nothing for everyone else. */
export async function AdminPageBarSlot() {
  await connection()
  const viewer = await getViewerPageEditAccess()
  if (!viewer) return null
  return <AdminPageBar access={viewer.access} ledTripIds={viewer.ledTripIds} />
}
