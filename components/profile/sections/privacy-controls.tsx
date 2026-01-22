import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ProfileSection } from '@/components/profile/profile-section'
import type { PrivacySettings } from '@/lib/profile/types'

interface PrivacyControlsProps {
  value: PrivacySettings
  onChange: <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => void
}

export function PrivacyControlsSection({ value, onChange }: PrivacyControlsProps) {
  return (
    <ProfileSection
      title="Privacy controls"
      description="Choose what other members can see."
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Show profile in directory</p>
          <p className="text-xs text-muted-foreground">Allow members to find you.</p>
        </div>
        <Switch
          checked={value.profileVisible}
          onCheckedChange={(checked) => onChange('profileVisible', checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Share email</p>
          <p className="text-xs text-muted-foreground">Visible to leaders only.</p>
        </div>
        <Switch
          checked={value.shareEmail}
          onCheckedChange={(checked) => onChange('shareEmail', checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Share phone</p>
          <p className="text-xs text-muted-foreground">Visible to trip leaders.</p>
        </div>
        <Switch
          checked={value.sharePhone}
          onCheckedChange={(checked) => onChange('sharePhone', checked)}
        />
      </div>
      <div className="grid gap-2">
        <Label className="text-xs text-muted-foreground">
          Privacy settings are stored in your profile and can be updated anytime.
        </Label>
      </div>
    </ProfileSection>
  )
}
