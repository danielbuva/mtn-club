'use client'

import { type ReactNode, useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'

export function SignupDialog({
  snapshot,
  open,
  onOpenChange,
  onStarted,
  trigger,
}: {
  snapshot: TripRegistrationSnapshot
  open: boolean
  onOpenChange: (open: boolean) => void
  onStarted: (later: boolean) => void
  trigger?: ReactNode
}) {
  const { run, pending, message } = useRegistrationCommand(snapshot.tripId)
  const [pendingChoice, setPendingChoice] = useState<'now' | 'later' | null>(
    null,
  )
  const deadline = new Date(snapshot.closeAt).toLocaleString('en-US', {
    timeZone: snapshot.timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  const begin = (later: boolean) => {
    if (pending) return
    setPendingChoice(later ? 'later' : 'now')
    run(
      {
        command: 'begin_signup',
        expectedRevision: snapshot.revision,
        data: {},
      },
      () => {
        onOpenChange(false)
        onStarted(later)
      },
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finish signing up</AlertDialogTitle>
          <AlertDialogDescription>
            Complete the following form by {deadline} to confirm your spot.
            {snapshot.availability === 'waitlist'
              ? ' This trip is currently full, so you’ll join the waitlist when you submit.'
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap">
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => begin(true)}
          >
            {pending && pendingChoice === 'later'
              ? 'Saving…'
              : 'Save for later'}
          </Button>
          <Button disabled={pending} onClick={() => begin(false)}>
            {pending && pendingChoice === 'now' ? 'Opening…' : 'Complete form'}
          </Button>
        </AlertDialogFooter>
        <output aria-live="polite">{message}</output>
      </AlertDialogContent>
    </AlertDialog>
  )
}
