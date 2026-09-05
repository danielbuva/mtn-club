import type { EventFormValues } from './schema'

export function emptyEventValues(isOfficial = false): EventFormValues {
  return {
    title: '',
    kind: 'outdoor',
    shortSummary: '',
    activityTypes: [],
    startAt: '',
    endAt: '',
    timezone: 'America/Los_Angeles',
    primaryLocationName: '',
    meetingLocationName: '',
    locationNotes: '',
    overviewWhat: '',
    overviewWhere: '',
    overviewWeather: '',
    overviewEquipment: '',
    overviewCarpoolNeedGear: '',
    visibility: 'members',
    maxParticipants: '',
    isOfficial,
    collectTransportation: false,
  }
}
export const creationSteps = [
  'basics',
  'place',
  'details',
  'risks',
  'settings',
  'review',
] as const
export const creationTitles: Record<string, string> = {
  basics: 'Start with the essentials.',
  place: 'When & where?',
  details: 'Help everyone come prepared.',
  risks: 'Informed risks',
  settings: 'Make it your trip.',
  review: 'Ready to get outside?',
}
export function creationStepForField(field: string) {
  if (['informedRisks', 'waiverActivities'].includes(field)) return 'risks'
  if (
    [
      'startAt',
      'endAt',
      'timezone',
      'primaryLocationName',
      'meetingLocationName',
      'locationNotes',
    ].includes(field)
  )
    return 'place'
  if (field.startsWith('overview') || field === 'difficulty') return 'details'
  if (
    ['maxParticipants', 'visibility', 'collectTransportation'].includes(field)
  )
    return 'settings'
  return 'basics'
}
export function normalizeEventValues(
  values: EventFormValues,
  noLimit: boolean,
  canChooseOfficial: boolean,
): EventFormValues {
  return {
    ...values,
    title: values.title.trim(),
    maxParticipants: noLimit ? '' : values.maxParticipants,
    isOfficial: canChooseOfficial && values.isOfficial,
    visibility:
      !canChooseOfficial && values.visibility === 'leaders_only'
        ? 'members'
        : values.visibility,
  }
}
