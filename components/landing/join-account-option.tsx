import { ArrowUpRight, CircleCheck, UserPlus } from 'lucide-react'
import { TrackLink } from '@/components/analytics/track-link'
import { createClient } from '@/lib/supabase/server'

const optionClass = 'mt-4 flex min-h-28 items-center gap-4 border p-5'

export function JoinAccountOptionSkeleton() {
  return (
    <div className={`${optionClass} border-[#211D18]/20`} aria-busy="true">
      <div className="size-7 shrink-0 animate-pulse bg-[#211D18]/10" />
      <div className="flex-1 space-y-2">
        <div className="h-8 w-48 animate-pulse bg-[#211D18]/10" />
        <div className="h-5 w-3/4 animate-pulse bg-[#211D18]/10" />
      </div>
      <span className="sr-only">Checking account status</span>
    </div>
  )
}

export async function JoinAccountOption() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return (
      <div
        className={`${optionClass} border-emerald-700/30 bg-emerald-50 text-emerald-900`}
      >
        <CircleCheck className="size-7 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide">
            Completed
          </p>
          <h2 className="font-brand text-2xl uppercase">Account created</h2>
          <p className="mt-1 text-sm">
            You’re signed in. This step is all set.
          </p>
        </div>
      </div>
    )
  }

  return (
    <TrackLink
      href="/auth/sign-up"
      eventName="join_create_account_click"
      className={`${optionClass} border-[#211D18]/20 transition hover:bg-[#E9DDC3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211D18]`}
    >
      <UserPlus className="size-7 shrink-0 text-[#6A5146]" aria-hidden="true" />
      <span className="flex-1">
        <span className="block font-brand text-2xl uppercase">
          Create an account
        </span>
        <span className="mt-1 block text-sm text-[#211D18]/65">
          Create your free Mountain Club account.
        </span>
      </span>
      <ArrowUpRight className="size-5 shrink-0" aria-hidden="true" />
    </TrackLink>
  )
}
