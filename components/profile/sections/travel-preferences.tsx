import { ProfileSection } from '@/components/profile/profile-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { TravelProfile } from '@/lib/profile/types'

interface TravelPreferencesProps {
  value: TravelProfile
  onChange: <K extends keyof TravelProfile>(
    key: K,
    value: TravelProfile[K],
  ) => void
}

export function TravelPreferencesSection({
  value,
  onChange,
}: TravelPreferencesProps) {
  return (
    <ProfileSection
      title="Travel & carpool preferences"
      description="Help coordinators match rides and departure times."
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">I can drive</p>
          <p className="text-xs text-muted-foreground">
            Let others know if you can carpool.
          </p>
        </div>
        <Switch
          checked={value.hasCar}
          onCheckedChange={checked => onChange('hasCar', checked)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Willing to drive others</p>
          <p className="text-xs text-muted-foreground">
            Opt in for carpool coordination.
          </p>
        </div>
        <Switch
          checked={value.willingToDrive}
          onCheckedChange={checked => onChange('willingToDrive', checked)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="seats">Available seats</Label>
          <Input
            id="seats"
            type="number"
            min={0}
            value={value.seats}
            onChange={e => onChange('seats', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="departureCity">Departure area</Label>
          <Input
            id="departureCity"
            value={value.departureCity}
            onChange={e => onChange('departureCity', e.target.value)}
            placeholder="Las Vegas, Summerlin"
          />
        </div>
      </div>
    </ProfileSection>
  )
}
