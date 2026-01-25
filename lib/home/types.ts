import type { EventRow } from '@/lib/events/types'

export type HomeTripRow = Pick<
  EventRow,
  | 'id'
  | 'title'
  | 'start_at'
  | 'end_at'
  | 'activity_types'
  | 'difficulty'
  | 'primary_location_name'
  | 'primary_location_lat'
  | 'primary_location_lng'
  | 'lat'
  | 'lon'
  | 'visibility'
  | 'short_summary'
  | 'description'
  | 'meetup_time'
  | 'meeting_location_name'
  | 'is_official'
>
