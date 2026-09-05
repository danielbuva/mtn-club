'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { loadRsvpChoicesAction } from '@/lib/registration/actions'
import type { TripRegistrationSnapshot } from '@/lib/registration/schema'
import { useRegistrationCommand } from '@/lib/registration/use-registration-command'
import { cn } from '@/lib/utils'
import { SignupDialog } from './signup-dialog'

export function RsvpChoices({
  tripId,
  state,
  className,
  onExpandedChange,
}: {
  tripId: string
  state?: TripRegistrationSnapshot['state']
  className?: string
  onExpandedChange?: (expanded: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<TripRegistrationSnapshot | null>(
    null,
  )
  const [optimisticState, setOptimisticState] = useState(state)
  const [loadError, setLoadError] = useState('')
  const [loading, startLoading] = useTransition()
  const { run, pending, message } = useRegistrationCommand(tripId)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const router = useRouter()
  const busy = loading || pending
  const displayState = optimisticState ?? state
  const label =
    displayState === 'maybe'
      ? 'Maybe'
      : displayState === 'cancelled'
        ? 'Not going'
        : 'RSVP'

  const expand = () => {
    setExpanded(true)
    onExpandedChange?.(true)
    setLoadError('')
    startLoading(async () => {
      try {
        setSnapshot(await loadRsvpChoicesAction(tripId))
      } catch {
        setLoadError('Couldn’t load RSVP options. Close and try again.')
      }
    })
  }
  const collapse = () => {
    setExpanded(false)
    onExpandedChange?.(false)
    requestAnimationFrame(() => trigger.current?.focus())
  }
  const choose = (choice: 'going' | 'maybe' | 'not_going') => {
    if (!snapshot) return
    if (!snapshot.authenticated) {
      router.push(
        `/auth/login?returnTo=${encodeURIComponent(`/trips/${tripId}/rsvp`)}`,
      )
      return
    }
    if (choice === 'going') {
      setExpanded(false)
      onExpandedChange?.(false)
      setDialogOpen(true)
      return
    }
    const previousState = displayState
    setOptimisticState(choice === 'maybe' ? 'maybe' : 'cancelled')
    collapse()
    run(
      {
        command: choice === 'maybe' ? 'set_maybe' : 'set_not_going',
        expectedRevision: snapshot.revision,
        data: {},
      },
      current => {
        setSnapshot(current)
      },
      () => setOptimisticState(previousState),
    )
  }

  return (
    <div className="w-full" data-rsvp-controls>
      <div className="flex items-center gap-1">
        {expanded ? (
          <fieldset
            id={id}
            className="flex min-w-0 flex-1 items-center gap-1"
            disabled={busy || !snapshot}
            aria-busy={busy}
          >
            <legend className="sr-only">Your RSVP</legend>
            <Button
              type="button"
              className="h-8 flex-1 px-2 text-xs"
              onClick={() => choose('going')}
            >
              Going
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 flex-1 px-2 text-xs"
              aria-pressed={displayState === 'maybe'}
              onClick={() => choose('maybe')}
            >
              Maybe
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 flex-1 px-2 text-xs"
              aria-pressed={displayState === 'cancelled'}
              onClick={() => choose('not_going')}
            >
              Not going
            </Button>
          </fieldset>
        ) : (
          <Button
            ref={trigger}
            type="button"
            className={cn('w-full', className)}
            size="sm"
            disabled={busy}
            aria-expanded={false}
            aria-controls={id}
            onClick={expand}
          >
            {label}
          </Button>
        )}
        {expanded ? (
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 shrink-0 p-0"
            aria-label="Close RSVP options"
            onClick={collapse}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {loadError || message ? (
        <output
          className={
            expanded ? 'block text-xs text-muted-foreground' : 'sr-only'
          }
          aria-live="polite"
        >
          {loadError || message}
        </output>
      ) : null}
      {snapshot ? (
        <SignupDialog
          snapshot={snapshot}
          open={dialogOpen}
          onOpenChange={open => {
            setDialogOpen(open)
            if (!open) collapse()
          }}
          onStarted={later => {
            collapse()
            if (!later) router.push(`/trips/${tripId}/rsvp`)
          }}
        />
      ) : null}
    </div>
  )
}
