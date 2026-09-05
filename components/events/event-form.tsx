'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import {
  addTripTagOptionAction,
  removeTripTagOptionsAction,
} from '@/app/(reader)/trips/actions'
import {
  publishTripFormAction,
  saveTripDraftAction,
} from '@/app/(reader)/trips/draft-actions'
import { toEventFormValuesFromDraft } from '@/lib/events/drafts'
import { emptyEventValues } from '@/lib/events/form-values'
import type { Database } from '@/lib/supabase/types'
import { PublishedTripRecovery } from './published-trip-recovery'
import { TripCreationFlow } from './trip-creation-flow'

type EventFormProps = {
  canChooseOfficial: boolean
  canManageTags: boolean
  initialIsOfficial: boolean
  initialDraft: Database['public']['Tables']['trip_drafts']['Row'] | null
  activityOptions: string[]
  publicHostOptions: { id: string; label: string }[]
  leaderOptions: { id: string; label: string }[]
  successPath: string
}
export function EventForm(props: EventFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const draftId = useRef(props.initialDraft?.id)
  const [publishedTripId, setPublishedTripId] = useState<string | null>(null)
  const [options, setOptions] = useState(props.activityOptions)
  const initial = props.initialDraft
    ? toEventFormValuesFromDraft({
        draft: props.initialDraft,
        canChooseOfficial: props.canChooseOfficial,
        timezoneFallback: 'America/Los_Angeles',
      })
    : {
        values: emptyEventValues(props.initialIsOfficial),
        isNoLimitEnabled: true,
      }
  if (publishedTripId)
    return (
      <PublishedTripRecovery
        tripId={publishedTripId}
        onDone={() => router.push(props.successPath)}
      />
    )

  return (
    <TripCreationFlow
      initialValues={initial.values}
      initialNoLimit={initial.isNoLimitEnabled}
      initialHostIds={props.initialDraft?.public_host_ids}
      initialLeaderIds={props.initialDraft?.leader_user_ids}
      canChooseOfficial={props.canChooseOfficial}
      activityOptions={options}
      publicHostOptions={props.canManageTags ? props.publicHostOptions : []}
      leaderOptions={props.canManageTags ? props.leaderOptions : []}
      onCancel={() => router.push(props.successPath)}
      onSave={async payload => {
        const result = await saveTripDraftAction(payload, draftId.current)
        draftId.current = result.id
        router.replace(`${pathname}?draft=${result.id}`, { scroll: false })
        return 'Draft saved. You can come back to it from your drafts.'
      }}
      onPublish={async payload => {
        const result = await publishTripFormAction({
          ...payload,
          sourceDraftId: draftId.current,
        })
        if (result.configurationPending) {
          setPublishedTripId(result.tripId)
          return 'Your trip is published; finish transportation setup next.'
        }
        router.push(
          result.informedRisksPending
            ? `/trips/${result.tripId}/registrations`
            : props.successPath,
        )
        return result.informedRisksPending
          ? 'Trip published. Add informed risks in registration settings before participants register.'
          : 'Trip published.'
      }}
      onAddTag={
        props.canManageTags
          ? async tag => {
              await addTripTagOptionAction(tag)
              setOptions(current => Array.from(new Set([...current, tag])))
            }
          : undefined
      }
      onRemoveTags={
        props.canManageTags
          ? async tags => {
              await removeTripTagOptionsAction(tags)
              setOptions(current => current.filter(tag => !tags.includes(tag)))
            }
          : undefined
      }
    />
  )
}
