'use client'

import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  deleteTripDraftAction,
  publishTripDraftAction,
} from '@/app/(reader)/trips/draft-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/lib/supabase/types'

type TripDraftRow = Database['public']['Tables']['trip_drafts']['Row']

type TripDraftsListProps = {
  drafts: TripDraftRow[]
}

export function TripDraftsList({ drafts }: TripDraftsListProps) {
  const router = useRouter()
  const [errorByDraftId, setErrorByDraftId] = useState<Record<string, string>>(
    {},
  )
  const [pendingByDraftId, setPendingByDraftId] = useState<
    Record<string, 'publish' | 'delete' | null>
  >({})
  const [isPending, startTransition] = useTransition()

  if (!drafts.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          You don&apos;t have any drafts yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {drafts.map(draft => {
        const isWorking = isPending || Boolean(pendingByDraftId[draft.id])
        const title = draft.title?.trim() || 'Untitled Draft'
        const updatedAgo = formatDistanceToNow(new Date(draft.updated_at), {
          addSuffix: true,
        })

        return (
          <Card key={draft.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Updated {updatedAgo}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {errorByDraftId[draft.id] ? (
                <p className="text-sm text-destructive">
                  {errorByDraftId[draft.id]}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/trips/new?draft=${draft.id}`}>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                  >
                    Edit
                  </Button>
                </Link>
                <Button
                  type="button"
                  disabled={isWorking}
                  className="rounded-xl"
                  onClick={() => {
                    setErrorByDraftId(prev => ({ ...prev, [draft.id]: '' }))
                    setPendingByDraftId(prev => ({
                      ...prev,
                      [draft.id]: 'publish',
                    }))
                    startTransition(async () => {
                      try {
                        await publishTripDraftAction(draft.id)
                        router.push('/trips')
                      } catch (error: unknown) {
                        setErrorByDraftId(prev => ({
                          ...prev,
                          [draft.id]:
                            error instanceof Error
                              ? error.message
                              : 'Unable to publish draft.',
                        }))
                      } finally {
                        setPendingByDraftId(prev => ({
                          ...prev,
                          [draft.id]: null,
                        }))
                      }
                    })
                  }}
                >
                  Publish
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isWorking}
                  className="rounded-xl"
                  onClick={() => {
                    setErrorByDraftId(prev => ({ ...prev, [draft.id]: '' }))
                    setPendingByDraftId(prev => ({
                      ...prev,
                      [draft.id]: 'delete',
                    }))
                    startTransition(async () => {
                      try {
                        await deleteTripDraftAction(draft.id)
                        router.refresh()
                      } catch (error: unknown) {
                        setErrorByDraftId(prev => ({
                          ...prev,
                          [draft.id]:
                            error instanceof Error
                              ? error.message
                              : 'Unable to delete draft.',
                        }))
                      } finally {
                        setPendingByDraftId(prev => ({
                          ...prev,
                          [draft.id]: null,
                        }))
                      }
                    })
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
