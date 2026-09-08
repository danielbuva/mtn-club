import { notFound } from 'next/navigation'
import { requireAdminCapability } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementEditor } from './announcement-editor'
export async function AnnouncementAdminEditor({ id }: { id?: string }) {
  const context = await requireAdminCapability(
    id ? 'announcements.read' : 'announcements.manage',
  )
  if (id && !/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const client = await createClient()
  const [item, published] = await Promise.all([
    id
      ? client.from('announcements').select('*').eq('id', id).maybeSingle()
      : Promise.resolve(null),
    client.from('announcements').select('*').eq('status', 'published'),
  ])
  if (item?.error || published.error)
    throw new Error('The editor could not be loaded. Please try again.')
  if (id && !item?.data) notFound()
  return (
    <AnnouncementEditor
      authorName={context.displayName}
      announcement={item?.data ?? undefined}
      published={published.data ?? []}
      canManage={Boolean(context.permissions['announcements.manage'])}
      now={new Date().toISOString()}
    />
  )
}
