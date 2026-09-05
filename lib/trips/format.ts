import { format, isSameDay } from 'date-fns'

export const formatTripDate = (
  startAt: Date,
  endAt?: Date,
  timeZone?: string,
) => {
  if (timeZone) {
    const date = (value: Date, options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(value)
    const day = (value: Date) =>
      date(value, { year: 'numeric', month: 'numeric', day: 'numeric' })
    if (!endAt || day(startAt) === day(endAt))
      return date(startAt, { weekday: 'short', month: 'short', day: 'numeric' })
    return `${date(startAt, { month: 'short', day: 'numeric', year: 'numeric' })} - ${date(endAt, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  if (!endAt || isSameDay(startAt, endAt)) {
    return format(startAt, 'EEE, MMM d')
  }

  if (format(startAt, 'yyyy') === format(endAt, 'yyyy')) {
    return `${format(startAt, 'MMM d')} - ${format(endAt, 'MMM d, yyyy')}`
  }

  return `${format(startAt, 'MMM d, yyyy')} - ${format(endAt, 'MMM d, yyyy')}`
}

export const formatTripTime = (
  startAt: Date,
  endAt?: Date,
  timeZone?: string,
) => {
  if (timeZone) {
    const time = (value: Date) =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
      }).format(value)
    const day = (value: Date) =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(value)
    if (!endAt) return time(startAt)
    return day(startAt) === day(endAt)
      ? `${time(startAt)} - ${time(endAt)}`
      : `${time(startAt)} start`
  }
  if (!endAt) {
    return format(startAt, 'h:mm a')
  }

  if (isSameDay(startAt, endAt)) {
    return `${format(startAt, 'h:mm a')} - ${format(endAt, 'h:mm a')}`
  }

  return `${format(startAt, 'h:mm a')} start`
}

export const formatSpots = (rsvpCount = 0, capacity?: number) => {
  if (typeof capacity !== 'number') {
    return `${rsvpCount} joined`
  }

  const remaining = Math.max(capacity - rsvpCount, 0)
  if (remaining > 0) {
    return `${remaining} spots left`
  }

  return `${rsvpCount} / ${capacity}`
}
