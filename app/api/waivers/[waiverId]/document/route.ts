import { annualStateSchema } from '@/lib/registration/annual-schema'
import { createClient } from '@/lib/supabase/server'
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ waiverId: string }> },
) {
  const { waiverId } = await params
  const db = await createClient()
  const { data, error } = await db.rpc('get_annual_waivers')
  if (error)
    return new Response('Sign in to view your waiver.', { status: 401 })
  const state = annualStateSchema.parse(data)
  const document =
    state.current?.id === waiverId
      ? state.current
      : state.history.find(record => record.id === waiverId)
  if (!document) return new Response('Waiver not found.', { status: 404 })
  return new Response(document.body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="unlv-rso-waiver-v${document.version}.txt"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
