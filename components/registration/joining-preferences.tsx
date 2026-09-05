import Link from 'next/link'
import { ToggleField } from '@/components/forms/fields'

export function JoiningPreferences({
  showInAttendeeList,
  emailUpdates,
  emailAllowed,
  onVisibilityChange,
  onEmailChange,
}: {
  showInAttendeeList: boolean
  emailUpdates: boolean
  emailAllowed: boolean
  onVisibilityChange: (value: boolean) => void
  onEmailChange: (value: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <ToggleField
        label="Show me in the attendee list"
        hint="Let other attendees see your name and profile. If off, you still count toward the trip total. Organizers can always see your registration."
        checked={showInAttendeeList}
        onChange={onVisibilityChange}
      />
      <ToggleField
        label="Email me trip updates"
        hint="Receive updates about trips you join. This changes your account’s trip-email preference, not club announcements."
        checked={emailUpdates}
        onChange={onEmailChange}
      />
      {!emailAllowed && (
        <p className="text-sm text-muted-foreground">
          All emails are currently disabled in your account. Turn on “Allow club
          emails” in Privacy settings to receive trip updates.
        </p>
      )}
      <p className="text-sm leading-relaxed text-muted-foreground">
        These choices are saved when you confirm and filled in next time. You
        can change attendee visibility for each trip, and email updates in{' '}
        <Link
          className="underline underline-offset-4"
          href="/profile/user/privacy"
        >
          Privacy settings
        </Link>
        .
      </p>
    </div>
  )
}
