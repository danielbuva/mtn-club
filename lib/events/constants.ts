export const EVENT_KINDS = [
  'outdoor',
  'indoor',
  'social',
  'service',
  'admin',
  'travel',
] as const

export const EVENT_VISIBILITIES = ['members', 'leaders_only', 'public'] as const

export const EVENT_STATUSES = [
  'draft',
  'published',
  'full',
  'canceled',
  'completed',
] as const

export const EVENT_DIFFICULTIES = [
  'Easy',
  'Moderate',
  'Challenging',
  'Expert',
] as const

export const ACTIVITY_OPTIONS = [
  'Hike',
  'Climb',
  'Snow',
  'Camp',
  'Run',
] as const
