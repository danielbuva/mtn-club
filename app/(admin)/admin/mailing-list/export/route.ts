import { z } from 'zod'
import { getAdminContext } from '@/lib/admin/auth'
import { buildMailingListCsv } from '@/lib/admin/csv'
import { createClient } from '@/lib/supabase/server'

const recipientsSchema = z.array(
  z.object({
    email: z.string(),
    displayName: z.string(),
    consentSource: z.string(),
    subscribedAt: z.string(),
  }),
)
export async function GET(request: Request) {
  const context = await getAdminContext()
  if (!context) return new Response('Unauthorized', { status: 401 })
  if (!context.permissions['mailing_list.export'])
    return new Response('Forbidden', { status: 403 })
  const topic = z
    .enum(['announcements', 'general', 'memberStories'])
    .safeParse(
      new URL(request.url).searchParams.get('topic') ?? 'announcements',
    )
  if (!topic.success)
    return new Response('Choose announcements, general, or memberStories.', {
      status: 400,
    })
  const db = await createClient()
  const { data, error } = await db.rpc('export_club_email_recipients', {
    p_topic: topic.data,
  })
  if (error)
    return new Response('Recipients could not be loaded. Please try again.', {
      status: 503,
    })
  return new Response(buildMailingListCsv(recipientsSchema.parse(data)), {
    headers: {
      'Content-Disposition': `attachment; filename="mountain-club-${topic.data}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
