'use client'

import { useActionState } from 'react'
import {
  claimZelleMembershipPayment,
  type ZelleClaimState,
} from '@/app/(site)/membership/actions'
import { Button } from '@/components/ui/button'

const initialState: ZelleClaimState = { status: 'idle', message: '' }

export function ZellePaymentClaimForm({
  renewal = false,
}: {
  renewal?: boolean
}) {
  const [state, formAction, pending] = useActionState(
    claimZelleMembershipPayment,
    initialState,
  )

  return (
    <form action={formAction} className="mt-4">
      <Button
        type="submit"
        disabled={pending}
        className="rounded-none bg-[#211D18] text-[#FFECA2]"
      >
        {pending
          ? 'Reporting payment…'
          : renewal
            ? 'I sent renewal dues'
            : 'I sent the dues'}
      </Button>
      {state.status !== 'idle' ? (
        <output aria-live="polite" className="mt-3 block text-sm">
          {state.message}
        </output>
      ) : null}
    </form>
  )
}
