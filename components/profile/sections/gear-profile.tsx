import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ProfileSection } from '@/components/profile/profile-section'
import type { GearProfile } from '@/lib/profile/types'

interface GearProfileProps {
  value: GearProfile
  onChange: <K extends keyof GearProfile>(key: K, value: GearProfile[K]) => void
}

export function GearProfileSection({ value, onChange }: GearProfileProps) {
  return (
    <ProfileSection
      title="Gear profile"
      description="Share what gear you have or need for trips."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="gearOwned">Gear owned</Label>
          <Textarea
            id="gearOwned"
            value={value.gearOwned}
            onChange={(e) => onChange('gearOwned', e.target.value)}
            placeholder="Tent, snowshoes, climbing rack"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gearNeeded">Gear needed</Label>
          <Textarea
            id="gearNeeded"
            value={value.gearNeeded}
            onChange={(e) => onChange('gearNeeded', e.target.value)}
            placeholder="Borrow/need list"
          />
        </div>
      </div>
    </ProfileSection>
  )
}
