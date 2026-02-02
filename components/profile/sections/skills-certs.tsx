import { ProfileSection } from '@/components/profile/profile-section'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SkillsCerts } from '@/lib/profile/types'

interface SkillsCertsProps {
  value: SkillsCerts
  onChange: <K extends keyof SkillsCerts>(key: K, value: SkillsCerts[K]) => void
}

export function SkillsCertsSection({ value, onChange }: SkillsCertsProps) {
  return (
    <ProfileSection
      title="Skills & certifications"
      description="Optional training or qualifications you want leaders to know about."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="skills">Skills</Label>
          <Textarea
            id="skills"
            value={value.skills}
            onChange={e => onChange('skills', e.target.value)}
            placeholder="Navigation, climbing, avalanche awareness"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="certifications">Certifications</Label>
          <Textarea
            id="certifications"
            value={value.certifications}
            onChange={e => onChange('certifications', e.target.value)}
            placeholder="WFR, WFA, AMGA"
          />
        </div>
      </div>
    </ProfileSection>
  )
}
