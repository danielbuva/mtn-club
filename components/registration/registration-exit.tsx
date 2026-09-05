'use client'

import { X } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export function RegistrationExit({
  onCancel,
  onSave,
  disabled,
  saveError,
}: {
  onCancel: () => Promise<void>
  onSave?: () => Promise<boolean>
  disabled?: boolean
  saveError?: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<'save' | 'cancel' | null>(null)
  const [error, setError] = useState('')
  const busy = useRef(false)
  async function choose(action: 'save' | 'cancel') {
    if (busy.current) return
    busy.current = true
    setPending(action)
    setError('')
    try {
      if (action === 'save') {
        if (onSave && (await onSave())) setOpen(false)
      } else {
        await onCancel()
        setOpen(false)
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to save your choice. Please try again.',
      )
    } finally {
      busy.current = false
      setPending(null)
    }
  }
  return (
    <AlertDialog
      open={open}
      onOpenChange={next => {
        if (!busy.current) {
          setOpen(next)
          setError('')
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Close registration"
          className="absolute -top-3 right-0 size-11"
        >
          <X className="size-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        data-guided-form
        className="flex max-h-dvh flex-col justify-center gap-6 overflow-y-auto text-foreground shadow-none max-sm:inset-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:border-0 max-sm:px-6"
      >
        <AlertDialogTitle className="font-brand text-3xl">
          Leave registration?
        </AlertDialogTitle>
        <AlertDialogDescription>
          Save your answers to return later, or cancel your registration and
          release any reserved place.
        </AlertDialogDescription>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            className="min-h-12"
            disabled={Boolean(pending) || !onSave}
            onClick={() => choose('save')}
          >
            {pending === 'save' ? 'Saving…' : 'Save and finish later'}
          </Button>
          {!onSave && (
            <p className="text-sm text-muted-foreground">
              There is no unfinished signup to save.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-12"
            disabled={Boolean(pending)}
            onClick={() => choose('cancel')}
          >
            {pending === 'cancel' ? 'Canceling…' : 'Cancel registration'}
          </Button>
          <AlertDialogCancel disabled={Boolean(pending)} className="min-h-12">
            Close overlay
          </AlertDialogCancel>
        </div>
        {(error || saveError) && (
          <p role="alert" className="text-sm text-destructive">
            {error || saveError}
          </p>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
