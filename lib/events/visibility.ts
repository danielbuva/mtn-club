import type { EventFormValues } from '@/lib/events/schema'
import type { Database } from '@/lib/supabase/types'

type TripVisibility = Database['public']['Enums']['trip_visibility']

const tripVisibilityByForm = {
  public: 'public',
  members: 'members',
  leaders_only: 'leaders',
} satisfies Record<EventFormValues['visibility'], TripVisibility>

export const mapVisibilityToTrip = (
  visibility: EventFormValues['visibility'],
): TripVisibility => tripVisibilityByForm[visibility]

export const mapVisibilityFromTrip = (
  visibility: TripVisibility,
): EventFormValues['visibility'] => {
  switch (visibility) {
    case 'public':
      return 'public'
    case 'members':
      return 'members'
    case 'leaders':
    case 'minimal':
      // Preserve the privacy intent of drafts saved before the migration.
      return 'leaders_only'
  }
}
