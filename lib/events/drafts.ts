import type { EventFormValues } from '@/lib/events/schema'
import type { Database } from '@/lib/supabase/types'
import { normalizeActivityTags } from './activity-tags'
import { EVENT_KINDS } from './constants'
import { eventDateTimeToIso, eventLocalDateTime } from './date-time'

const mapDifficultyToTrip = (
  difficulty: EventFormValues['difficulty'],
): Database['public']['Enums']['trip_difficulty'] | null => {
  if (!difficulty) {
    return null
  }
  if (difficulty === 'Moderate') {
    return 'intermediate'
  }
  if (difficulty === 'Challenging') {
    return 'hard'
  }
  if (difficulty === 'Expert') {
    return 'expert'
  }
  return 'beginner'
}

const mapDifficultyFromTrip = (
  difficulty: Database['public']['Enums']['trip_difficulty'] | null,
): EventFormValues['difficulty'] => {
  if (!difficulty) {
    return undefined
  }
  if (difficulty === 'intermediate') {
    return 'Moderate'
  }
  if (difficulty === 'hard') {
    return 'Challenging'
  }
  if (difficulty === 'expert') {
    return 'Expert'
  }
  return 'Easy'
}

const mapVisibilityToTrip = (
  visibility: EventFormValues['visibility'],
): Database['public']['Enums']['trip_visibility'] => {
  if (visibility === 'public') {
    return 'public'
  }
  if (visibility === 'members') {
    return 'members'
  }
  return 'minimal'
}

const mapVisibilityFromTrip = (
  visibility: Database['public']['Enums']['trip_visibility'],
  canChooseOfficial: boolean,
): EventFormValues['visibility'] => {
  if (visibility === 'public') {
    return 'public'
  }
  if (visibility === 'minimal') {
    return canChooseOfficial ? 'leaders_only' : 'members'
  }
  return 'members'
}

function draftDateTime(value: string, timeZone: string) {
  try {
    return eventDateTimeToIso(value, timeZone)
  } catch {
    return null
  }
}
export const toDraftRowInput = ({
  values,
  isNoLimitEnabled,
  createdBy,
  canChooseOfficial,
}: {
  values: EventFormValues
  isNoLimitEnabled: boolean
  createdBy: string
  canChooseOfficial: boolean
}): Database['public']['Tables']['trip_drafts']['Insert'] => {
  const parsedMax = Number.parseInt(values.maxParticipants ?? '', 10)
  const maxParticipants =
    isNoLimitEnabled || !Number.isFinite(parsedMax) || parsedMax <= 0
      ? null
      : parsedMax

  return {
    created_by: createdBy,
    event_kind: values.kind,
    collect_transportation: values.collectTransportation,
    informed_risks: values.informedRisks ?? '',
    waiver_activities: values.waiverActivities ?? [],
    title: values.title.trim() || null,
    short_summary: values.shortSummary?.trim() || null,
    activity_tags: normalizeActivityTags(values.activityTypes ?? []),
    starts_at: draftDateTime(
      values.startAt,
      values.timezone || 'America/Los_Angeles',
    ),
    ends_at: draftDateTime(
      values.endAt,
      values.timezone || 'America/Los_Angeles',
    ),
    time_zone: values.timezone?.trim() || null,
    primary_location_name: values.primaryLocationName?.trim() || null,
    meeting_location_name: values.meetingLocationName?.trim() || null,
    location_notes: values.locationNotes?.trim() || null,
    overview_what: values.overviewWhat?.trim() || null,
    overview_where: values.overviewWhere?.trim() || null,
    overview_weather: values.overviewWeather?.trim() || null,
    overview_equipment: values.overviewEquipment?.trim() || null,
    overview_carpool_need_gear: values.overviewCarpoolNeedGear?.trim() || null,
    visibility: mapVisibilityToTrip(values.visibility),
    difficulty: mapDifficultyToTrip(values.difficulty),
    max_participants: maxParticipants,
    is_official: canChooseOfficial ? values.isOfficial : false,
    updated_at: new Date().toISOString(),
  }
}

export const toEventFormValuesFromDraft = ({
  draft,
  canChooseOfficial,
  timezoneFallback,
}: {
  draft: Database['public']['Tables']['trip_drafts']['Row']
  canChooseOfficial: boolean
  timezoneFallback: string
}): { values: EventFormValues; isNoLimitEnabled: boolean } => {
  return {
    values: {
      title: draft.title ?? '',
      shortSummary: draft.short_summary ?? '',
      kind: EVENT_KINDS.find(kind => kind === draft.event_kind) ?? 'outdoor',
      collectTransportation: draft.collect_transportation ?? false,
      activityTypes: normalizeActivityTags(draft.activity_tags ?? []),
      informedRisks: draft.informed_risks ?? '',
      waiverActivities: draft.waiver_activities ?? [],
      startAt: eventLocalDateTime(
        draft.starts_at,
        draft.time_zone || timezoneFallback,
      ),
      endAt: eventLocalDateTime(
        draft.ends_at,
        draft.time_zone || timezoneFallback,
      ),
      timezone: draft.time_zone ?? timezoneFallback,
      primaryLocationName: draft.primary_location_name ?? '',
      meetingLocationName: draft.meeting_location_name ?? '',
      locationNotes: draft.location_notes ?? '',
      overviewWhat: draft.overview_what ?? '',
      overviewWhere: draft.overview_where ?? '',
      overviewWeather: draft.overview_weather ?? '',
      overviewEquipment: draft.overview_equipment ?? '',
      overviewCarpoolNeedGear: draft.overview_carpool_need_gear ?? '',
      visibility: mapVisibilityFromTrip(draft.visibility, canChooseOfficial),
      maxParticipants:
        typeof draft.max_participants === 'number'
          ? String(draft.max_participants)
          : '',
      difficulty: mapDifficultyFromTrip(draft.difficulty),
      isOfficial: canChooseOfficial ? draft.is_official : false,
    },
    isNoLimitEnabled: draft.max_participants === null,
  }
}

export const publishValidationErrors = (values: EventFormValues) => {
  const missing: string[] = []
  if (!values.title.trim()) {
    missing.push('title')
  }
  if (!values.startAt.trim()) {
    missing.push('start date')
  }
  if (!values.endAt.trim()) {
    missing.push('end date')
  }
  if (!values.timezone.trim()) {
    missing.push('timezone')
  }
  if (!values.primaryLocationName.trim()) {
    missing.push('primary location')
  }
  return missing
}
