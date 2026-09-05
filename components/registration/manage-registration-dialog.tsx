'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { loadRsvpChoicesAction } from '@/lib/registration/actions'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'

export function ManageRegistrationAlertDialog({
  tripId,
  className,
}: {
  tripId: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { run, pending, message } = useRegistrationCommand(tripId)
  async function cancel() {
    setLoading(true)
    setError('')
    try {
      const snapshot = await loadRsvpChoicesAction(tripId)
      const result = await run({
        command: 'cancel',
        expectedRevision: snapshot.revision,
        data: {},
      })
      if (result.ok) setOpen(false)
    } catch {
      setError('Unable to load your registration. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" className={className}>
          Going
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Manage your registration</AlertDialogTitle>
        <AlertDialogDescription>
          You’re registered for this trip. Edit your details or cancel your
          registration to release your place.
        </AlertDialogDescription>
        <Button asChild>
          <Link href={`/trips/${tripId}/rsvp`}>Edit registration</Link>
        </Button>
        <Button
          variant="outline"
          disabled={loading || pending}
          onClick={cancel}
        >
          {loading || pending ? 'Canceling…' : 'Cancel registration'}
        </Button>
        <AlertDialogCancel>Keep registration</AlertDialogCancel>
        {(error || message) && <p role="alert">{error || message}</p>}
      </AlertDialogContent>
    </AlertDialog>
  )
}
