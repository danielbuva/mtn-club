'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { SignupDialog } from './signup-dialog'

export function SignupIntent({
  snapshot,
}: {
  snapshot: TripRegistrationSnapshot
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  return (
    <section className="space-y-3 rounded-lg border p-5">
      <h2 className="text-xl font-semibold">Will you be going?</h2>
      <p className="text-sm text-muted-foreground">
        Complete the trip form to confirm your RSVP.
      </p>
      <SignupDialog
        snapshot={snapshot}
        open={open}
        onOpenChange={setOpen}
        trigger={<Button>Going</Button>}
        onStarted={later => {
          if (later) router.push(`/trips/${snapshot.tripId}`)
        }}
      />
    </section>
  )
}
