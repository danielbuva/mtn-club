import { eventDateTimeToIso, eventLocalDateTime } from './date-time'

type StoredTripDates = {
  starts_at: string
  ends_at: string | null
  rsvp_deadline: string | null
  time_zone: string | null
  is_all_day: boolean
}

function resolveDate(
  value: FormDataEntryValue | null,
  original: string | null,
  timeZone: string,
) {
  if (typeof value !== 'string' || !value.trim()) return original
  // Preserve seconds and the exact occurrence of an unchanged DST repeated hour.
  if (original && value === eventLocalDateTime(original, timeZone))
    return original
  return eventDateTimeToIso(value, timeZone)
}

export function resolveTripEditDates(form: FormData, trip: StoredTripDates) {
  const timeZone = trip.time_zone ?? 'America/Los_Angeles'
  const startsAt = resolveDate(form.get('startAt'), trip.starts_at, timeZone)
  const endsAt = resolveDate(form.get('endAt'), trip.ends_at, timeZone)
  if (!startsAt || (form.get('endAt') && !endsAt)) {
    return {
      ok: false,
      error: `Enter valid event dates in ${timeZone}. This time may not exist during a daylight-saving change.`,
    } as const
  }
  if (endsAt && new Date(endsAt) < new Date(startsAt)) {
    return {
      ok: false,
      error: 'The event end must be after its start.',
    } as const
  }
  if (trip.rsvp_deadline && new Date(trip.rsvp_deadline) > new Date(startsAt)) {
    return {
      ok: false,
      error:
        'The event starts before its registration deadline. Move the start later or update the deadline in Manage registration first.',
    } as const
  }
  const timeTba = form.get('timeTba')
  const isAllDay =
    timeTba === 'true'
      ? true
      : timeTba === 'false'
        ? false
        : trip.is_all_day &&
          new Date(startsAt).getTime() === new Date(trip.starts_at).getTime()
  return { ok: true, startsAt, endsAt, isAllDay } as const
}
