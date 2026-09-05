'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { changeTripLifecycleAction } from '@/app/(admin)/admin/trips/actions'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

type Lifecycle = 'published' | 'canceled' | 'archived'

export function TripLifecycleControls({
  tripId,
  title,
  lifecycle,
  reason,
  deletedHref,
}: {
  tripId: string
  title: string
  lifecycle: Lifecycle
  reason?: string | null
  deletedHref?: string
}) {
  const router = useRouter()
  const reasonId = useId()
  const [operation, setOperation] = useState<Lifecycle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const open = (next: Lifecycle) => {
    setError(null)
    setOperation(next)
  }
  const label =
    operation === 'canceled'
      ? 'Cancel trip'
      : operation === 'archived'
        ? 'Delete trip'
        : 'Restore trip'

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {lifecycle !== 'archived' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => open('canceled')}
          >
            {lifecycle === 'canceled' ? 'Edit cancellation' : 'Cancel trip'}
          </Button>
        )}
        {lifecycle !== 'archived' && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => open('archived')}
          >
            Delete trip
          </Button>
        )}
        {lifecycle !== 'published' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => open('published')}
          >
            Restore trip
          </Button>
        )}
      </div>
      <Sheet
        open={operation !== null}
        onOpenChange={isOpen => {
          if (!isOpen && !pending) setOperation(null)
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[90dvh] overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto w-full max-w-lg space-y-4">
            <SheetTitle>
              {label}: {title}
            </SheetTitle>
            <SheetDescription>
              {operation === 'canceled'
                ? 'Keep the trip visible with a canceled label. The reason will be public. Registration will close.'
                : operation === 'archived'
                  ? 'Remove this trip from public listings. Its history is retained, and leadership can restore it later.'
                  : 'Make this trip available again. If registration was enabled, review its settings before reopening sign-ups.'}
            </SheetDescription>
            <form
              className="space-y-4"
              action={formData => {
                if (!operation) return
                const next = operation
                formData.set('tripId', tripId)
                formData.set('lifecycle', next)
                startTransition(async () => {
                  try {
                    await changeTripLifecycleAction(formData)
                    setOperation(null)
                    if (next === 'archived' && deletedHref)
                      router.push(deletedHref)
                    router.refresh()
                  } catch {
                    setError(
                      'The trip could not be updated. Check your permissions and try again.',
                    )
                  }
                })
              }}
            >
              {operation === 'canceled' && (
                <div className="space-y-2">
                  <label htmlFor={reasonId} className="text-sm font-medium">
                    Reason (optional)
                  </label>
                  <Textarea
                    id={reasonId}
                    name="reason"
                    defaultValue={reason ?? ''}
                    maxLength={500}
                    rows={3}
                    placeholder="For example: Canceled due to rain."
                    disabled={pending}
                  />
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <SheetClose asChild>
                  <Button type="button" variant="outline" disabled={pending}>
                    Keep current status
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  variant={
                    operation === 'published' ? 'default' : 'destructive'
                  }
                  disabled={pending}
                >
                  {pending ? 'Saving…' : label}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
