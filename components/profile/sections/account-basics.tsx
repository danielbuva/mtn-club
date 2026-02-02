import { ProfileSection } from '@/components/profile/profile-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ProfileFormValues } from '@/lib/profile/types'

interface AccountBasicsProps {
  values: ProfileFormValues
  onChange: <K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ) => void
}

export function AccountBasicsSection({ values, onChange }: AccountBasicsProps) {
  return (
    <ProfileSection
      title="Account basics"
      description="Your public profile details. All fields are optional."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={values.displayName}
            onChange={e => onChange('displayName', e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={values.username}
            onChange={e => onChange('username', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input
            id="avatarUrl"
            value={values.avatarUrl}
            onChange={e => onChange('avatarUrl', e.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input
            id="pronouns"
            value={values.pronouns}
            onChange={e => onChange('pronouns', e.target.value)}
            placeholder="she/her, they/them"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={values.bio}
          onChange={e => onChange('bio', e.target.value)}
          placeholder="Tell the club about yourself"
        />
      </div>
    </ProfileSection>
  )
}
