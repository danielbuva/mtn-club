'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export function MembershipPendingFields({
  children,
}: {
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <fieldset disabled={pending} className="space-y-10" aria-busy={pending}>
      {children}
    </fieldset>
  )
}

export function MembershipAuthControls({
  createsAccount,
}: {
  createsAccount: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <div className="w-full space-y-4">
      <Button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-none bg-[#211D18] px-7 text-base text-[#FFECA2] hover:bg-[#352E27] sm:w-auto"
      >
        {pending
          ? createsAccount
            ? 'Creating your account…'
            : 'Submitting application…'
          : createsAccount
            ? 'Create account and submit'
            : 'Submit membership application'}
      </Button>
    </div>
  )
}
