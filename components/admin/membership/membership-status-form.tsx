'use client'

import { useActionState } from 'react'
import {
  type MembershipStatusActionState,
  setZellePaymentStatusAction,
} from '@/app/(admin)/admin/membership/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const initialState: MembershipStatusActionState = {
  status: 'idle',
  message: '',
}

export function MembershipStatusForm({
  applicantId,
  defaultPaymentStatus,
  defaultNote,
  canReviewPayment,
  canGrantComplimentary,
  disabled,
}: {
  applicantId: string
  defaultPaymentStatus: 'pending' | 'accepted' | 'rejected' | 'complimentary'
  defaultNote: string
  canReviewPayment: boolean
  canGrantComplimentary: boolean
  disabled: boolean
}) {
  const [state, formAction, pending] = useActionState(
    setZellePaymentStatusAction,
    initialState,
  )
  const busy = disabled || pending

  return (
    <form
      action={formAction}
      className="grid min-w-0 w-full gap-3 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto]"
    >
      <input type="hidden" name="applicantId" value={applicantId} />
      <label
        htmlFor={`payment-status-${applicantId}`}
        className="grid min-w-0 gap-1 text-xs font-medium"
      >
        Payment status
        <select
          id={`payment-status-${applicantId}`}
          name="paymentStatus"
          defaultValue={defaultPaymentStatus}
          disabled={busy}
          className="h-9 min-w-0 w-full border border-input bg-background px-3 text-sm"
        >
          {canReviewPayment ? (
            <>
              <option value="accepted">Payment confirmed</option>
              <option value="pending">Payment not yet received</option>
              <option value="rejected">Application rejected</option>
            </>
          ) : null}
          {canGrantComplimentary ? (
            <option value="complimentary">
              Make member without confirming payment
            </option>
          ) : null}
        </select>
      </label>
      <label
        htmlFor={`payment-note-${applicantId}`}
        className="grid min-w-0 gap-1 text-xs font-medium"
      >
        Internal note
        <Input
          id={`payment-note-${applicantId}`}
          name="note"
          maxLength={500}
          defaultValue={defaultNote}
          placeholder="Optional internal note"
          disabled={busy}
        />
      </label>
      <Button className="self-end" disabled={busy}>
        {pending ? 'Updating…' : 'Update status'}
      </Button>
      {state.status !== 'idle' ? (
        <output
          aria-live="polite"
          className={`text-sm sm:col-span-3 ${
            state.status === 'error'
              ? 'text-destructive'
              : 'text-[#476238] dark:text-[#A8D894]'
          }`}
        >
          {state.message}
        </output>
      ) : null}
    </form>
  )
}
