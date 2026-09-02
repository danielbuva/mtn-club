import { format, isSameDay } from 'date-fns'

export const formatTripDate = (startAt: Date, endAt?: Date) => {
  if (!endAt || isSameDay(startAt, endAt)) {
    return format(startAt, 'EEE, MMM d')
  }

  if (format(startAt, 'yyyy') === format(endAt, 'yyyy')) {
    return `${format(startAt, 'MMM d')} - ${format(endAt, 'MMM d, yyyy')}`
  }

  return `${format(startAt, 'MMM d, yyyy')} - ${format(endAt, 'MMM d, yyyy')}`
}

export const formatTripTime = (startAt: Date, endAt?: Date) => {
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
