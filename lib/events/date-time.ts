/** Convert a stored instant to a datetime-local value in the trip's timezone. */
export function eventLocalDateTime(
  instant: string | null,
  timeZone: string,
): string {
  if (!instant) return ''
  const date = new Date(instant)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (name: string) =>
    parts.find(part => part.type === name)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

/** Resolve a wall time without depending on the browser or server timezone. */
export function eventDateTimeToIso(
  value: string,
  timeZone: string,
): string | null {
  if (!value.trim()) return null
  // Older callers may already provide an explicit instant.
  if (/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day, hour, minute] = match
  const desired = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  )
  if (new Date(desired).toISOString().slice(0, 16) !== value) return null
  let candidate = desired
  for (let attempt = 0; attempt < 4; attempt++) {
    const local = eventLocalDateTime(
      new Date(candidate).toISOString(),
      timeZone,
    )
    const delta = desired - new Date(`${local}:00Z`).getTime()
    if (delta === 0) {
      // For a repeated hour during fall-back, consistently use its first occurrence.
      const earlier = candidate - 3600000
      if (
        eventLocalDateTime(new Date(earlier).toISOString(), timeZone) === value
      )
        candidate = earlier
      return new Date(candidate).toISOString()
    }
    candidate += delta
  }
  // A wall time in the spring-forward gap does not exist.
  return null
}
