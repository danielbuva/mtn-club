import { Webhook } from 'svix'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const deliverySchema = z.object({
  type: z.string(),
  data: z.object({ email_id: z.string() }),
})
export async function POST(request: Request) {
  const secret = process.env.REGISTRATION_RESEND_WEBHOOK_SECRET
  if (!secret)
    return new Response('Delivery webhook not configured', { status: 503 })
  const eventId = request.headers.get('svix-id') ?? ''
  const raw = await request.text()
  if (raw.length > 100000)
    return new Response('Payload too large', { status: 413 })
  let verified: unknown
  try {
    new Webhook(secret).verify(raw, {
      'svix-id': eventId,
      'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
      'svix-signature': request.headers.get('svix-signature') ?? '',
    })
    verified = JSON.parse(raw)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }
  const parsed = deliverySchema.safeParse(verified)
  if (!parsed.success)
    return new Response('Invalid delivery event', { status: 400 })
  const status =
    parsed.data.type === 'email.delivered'
      ? 'delivered'
      : parsed.data.type === 'email.bounced'
        ? 'bounced'
        : parsed.data.type === 'email.failed' ||
            parsed.data.type === 'email.complained'
          ? 'failed'
          : null
  if (!status) return new Response('Ignored', { status: 200 })
  const db = createAdminClient()
  const result = await db.rpc('registration_delivery', {
    p_event_id: eventId,
    p_provider_id: parsed.data.data.email_id,
    p_status: status,
  })
  return new Response(result.error ? 'Delivery update failed' : 'OK', {
    status: result.error ? 500 : 200,
  })
}
