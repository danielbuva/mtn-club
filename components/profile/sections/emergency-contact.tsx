import { ProfileSection } from '@/components/profile/profile-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EmergencyContact } from '@/lib/profile/types'

interface EmergencyContactProps {
  value: EmergencyContact
  onChange: <K extends keyof EmergencyContact>(
    key: K,
    value: EmergencyContact[K],
  ) => void
}

export function EmergencyContactSection({
  value,
  onChange,
}: EmergencyContactProps) {
  return (
    <ProfileSection
      title="Emergency contact"
      description="Optional details in case of an emergency on trips."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="emergencyName">Contact name</Label>
          <Input
            id="emergencyName"
            value={value.name}
            onChange={e => onChange('name', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="emergencyRelationship">Relationship</Label>
          <Input
            id="emergencyRelationship"
            value={value.relationship}
            onChange={e => onChange('relationship', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="emergencyPhone">Phone</Label>
          <Input
            id="emergencyPhone"
            value={value.phone}
            onChange={e => onChange('phone', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="emergencyNotes">Notes</Label>
          <Textarea
            id="emergencyNotes"
            value={value.notes}
            onChange={e => onChange('notes', e.target.value)}
            placeholder="Allergies, medical info, etc."
          />
        </div>
      </div>
    </ProfileSection>
  )
}
