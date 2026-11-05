import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

const mergeRequestSchema = z.object({
  primaryUserId: z.string().uuid(),
  secondaryUserId: z.string().uuid(),
  dryRun: z.boolean().default(true),
})

const mergeResultSchema = z.object({
  counts: z.record(z.string(), z.number()),
  status: z.enum(['preview', 'pending_auth_delete', 'completed']),
  resumed: z.boolean(),
})

const assertAdmin = async () => {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { ok: false as const, status: 401, error: 'Unauthorized.' }
  }
  const permission = await supabase.rpc('has_admin_capability', {
    p_uid: user.id,
    p_capability_key: 'accounts.update',
  })
  if (permission.error) {
    return {
      ok: false as const,
      status: 503,
      error: 'Could not verify account management permission. Retry shortly.',
    }
  }
  if (!permission.data) {
    return {
      ok: false as const,
      status: 403,
      error: 'Account management permission required.',
    }
  }
  return { ok: true as const, userId: user.id }
}

export async function POST(request: Request) {
  const guard = await assertAdmin()
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }
  const body: unknown = await request.json().catch(() => null)
  const parsed = mergeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { primaryUserId, secondaryUserId, dryRun } = parsed.data
  if (primaryUserId === secondaryUserId) {
    return NextResponse.json(
      { error: 'Choose two different accounts.' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const args = {
    p_actor: guard.userId,
    p_primary: primaryUserId,
    p_secondary: secondaryUserId,
  }
  // Do not look up the secondary auth user here: a retry may follow a successful
  // auth deletion whose completion acknowledgement was interrupted.
  const result = await Promise.resolve(
    admin.rpc('merge_accounts', { ...args, p_dry_run: dryRun }),
  ).catch(() => null)
  if (!result) {
    return NextResponse.json(
      { error: 'Could not confirm merge status. Retry the same account pair.' },
      { status: 503 },
    )
  }
  if (result.error) {
    const status =
      result.error.code === '42501'
        ? 403
        : result.error.code === '22023'
          ? 409
          : 503
    return NextResponse.json(
      {
        error: `${result.error.message} Review the accounts and retry the same pair.`,
      },
      { status },
    )
  }
  const merge = mergeResultSchema.safeParse(result.data)
  if (!merge.success) {
    return NextResponse.json(
      { error: 'Could not confirm merge status. Retry the same account pair.' },
      { status: 503 },
    )
  }
  const audit = {
    primaryUserId,
    secondaryUserId,
    dryRun,
    selectedBy: 'request',
    counts: merge.data.counts,
  }
  if (dryRun || merge.data.status === 'completed') {
    return NextResponse.json({
      audit,
      applied: !dryRun,
      status: merge.data.status,
      resumed: merge.data.resumed,
    })
  }

  try {
    const deletion = await admin.auth.admin.deleteUser(secondaryUserId)
    if (
      deletion.error &&
      deletion.error.status !== 404 &&
      deletion.error.code !== 'user_not_found'
    ) {
      throw deletion.error
    }
    const completion = await admin.rpc('complete_account_merge', args)
    if (completion.error) throw completion.error
  } catch {
    return NextResponse.json(
      {
        audit,
        applied: true,
        status: 'pending_auth_delete',
        error:
          'Database records were merged. Auth cleanup is pending. Retry the same account pair to finish; the database transfer will not repeat.',
      },
      { status: 503 },
    )
  }
  return NextResponse.json({
    audit,
    applied: true,
    status: 'completed',
    resumed: merge.data.resumed,
  })
}
