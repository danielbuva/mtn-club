import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProfileSection } from '@/components/profile/profile-section'
import type { InterestsPreferences } from '@/lib/profile/types'

interface InterestsPreferencesProps {
  value: InterestsPreferences
  onChange: <K extends keyof InterestsPreferences>(key: K, value: InterestsPreferences[K]) => void
}

export function InterestsPreferencesSection({ value, onChange }: InterestsPreferencesProps) {
  return (
    <ProfileSection
      title="Interests & preferences"
      description="Tell us what you enjoy so we can match you with trips."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="interests">Interests</Label>
          <Textarea
            id="interests"
            value={value.interests}
            onChange={(e) => onChange('interests', e.target.value)}
            placeholder="Hiking, climbing, stargazing"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="preferredActivities">Preferred activities</Label>
          <Textarea
            id="preferredActivities"
            value={value.preferredActivities}
            onChange={(e) => onChange('preferredActivities', e.target.value)}
            placeholder="Sunrise hikes, service trips"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="availability">Availability</Label>
        <Textarea
          id="availability"
          value={value.availability}
          onChange={(e) => onChange('availability', e.target.value)}
          placeholder="Weekends, weekday evenings"
        />
      </div>
    </ProfileSection>
  )
}
