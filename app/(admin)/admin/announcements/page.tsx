import Link from 'next/link'
import { Suspense } from 'react'
import { AdminViewFrame } from '@/components/admin/admin-view-frame'
import { AnnouncementAdminLoading } from '@/components/announcements/announcement-admin-loading'
import { Button } from '@/components/ui/button'
import { requireAdminCapability } from '@/lib/admin/auth'
import { announcementStatus } from '@/lib/announcements/schedule'
import { ANNOUNCEMENT_TIME_ZONE } from '@/lib/announcements/types'
import { createClient } from '@/lib/supabase/server'

async function List() {
  const context = await requireAdminCapability('announcements.read')
  const client = await createClient()
  const { data, error } = await client
    .from('announcements')
    .select('*')
    .order('starts_at', { ascending: false })
  if (error)
    throw new Error('Announcements could not be loaded. Please try again.')
  const now = Date.now()
  const format = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: ANNOUNCEMENT_TIME_ZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(value))
  return (
    <div className="space-y-6">
      {context.permissions['announcements.manage'] && (
        <Button asChild>
          <Link href="/admin/announcements/new">New announcement</Link>
        </Button>
      )}
      <p className="text-sm text-muted-foreground">
        Published notices appear automatically. Expired notices remain in the
        public archive; archived notices are hidden.
      </p>
      {data.length ? (
        <div className="divide-y divide-border">
          {data.map(item => (
            <Link
              key={item.id}
              href={`/admin/announcements/${item.id}`}
              className="block space-y-2 py-5 focus-visible:outline-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-brand text-2xl uppercase">{item.title}</h2>
                <span className="border border-border px-3 py-1 text-xs">
                  {announcementStatus(item, now)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(item.starts_at)} → {format(item.ends_at)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="border-y border-border py-10">
          The noticeboard is empty. Create your first announcement.
        </p>
      )}
    </div>
  )
}
export default function Page() {
  return (
    <AdminViewFrame view="announcements">
      <Suspense fallback={<AnnouncementAdminLoading />}>
        <List />
      </Suspense>
    </AdminViewFrame>
  )
}
