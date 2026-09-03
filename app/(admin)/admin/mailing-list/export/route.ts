import { getAdminContext } from '@/lib/admin/auth'
import { buildMailingListCsv } from '@/lib/admin/csv'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const context = await getAdminContext()
  if (!context) return new Response('Unauthorized', { status: 401 })
  if (!context.permissions['mailing_list.export']) {
    return new Response('Forbidden', { status: 403 })
  }
  const admin = createAdminClient()
  const [subscriptions, profiles] = await Promise.all([
    admin
      .from('mailing_list_subscriptions')
      .select('user_id, email, consent_source, subscribed_at')
      .eq('subscribed', true)
      .order('email'),
    admin.from('profiles').select('user_id, display_name'),
  ])
  if (subscriptions.error) throw subscriptions.error
  if (profiles.error) throw profiles.error
  const profileNames = new Map(
    (profiles.data ?? []).map(profile => [
      profile.user_id,
      profile.display_name,
    ]),
  )
  const csv = buildMailingListCsv(
    (subscriptions.data ?? []).map(subscription => ({
      email: subscription.email,
      displayName: profileNames.get(subscription.user_id) ?? '',
      consentSource: subscription.consent_source,
      subscribedAt: subscription.subscribed_at ?? '',
    })),
  )

  return new Response(csv, {
    headers: {
      'Content-Disposition': `attachment; filename="mountain-club-mailing-list-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
