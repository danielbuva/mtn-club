import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfileSection } from '@/components/profile/profile-section'
import type { ProfileFormValues } from '@/lib/profile/types'

interface ContactCommunicationProps {
  email: string | null
  values: ProfileFormValues
  onChange: <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => void
}

export function ContactCommunicationSection({ email, values, onChange }: ContactCommunicationProps) {
  return (
    <ProfileSection
      title="Contact & communication"
      description="How other members can reach you."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email ?? ''} disabled placeholder="Not set" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="(702) 555-1234"
          />
        </div>
      </div>
    </ProfileSection>
  )
}
