import { timingSafeEqual } from 'node:crypto'
import { processRegistrationNotifications } from '@/lib/registration/worker'
import { createAdminClient } from '@/lib/supabase/admin'
export const maxDuration = 60
export async function POST(request: Request) {
  const expected = process.env.REGISTRATION_WORKER_SECRET
  const supplied =
    request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (
    !expected ||
    expected.length < 32 ||
    Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
  ) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return Response.json(await processRegistrationNotifications())
  } catch {
    const db = createAdminClient()
    await db.rpc('registration_worker_result', { p_error: 'worker_failed' })
    console.error(
      'Registration worker failed; inspect registration operations.',
    )
    return Response.json({ error: 'Processing failed' }, { status: 500 })
  }
}
