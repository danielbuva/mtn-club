import { Instagram, Mail } from 'lucide-react'
import { FieldNote } from '@/components/editorial/field-note'
import { MastheadEntry } from '@/components/team/masthead-entry'
import type { TeamMember } from '@/lib/data'

interface TeamCardProps {
  member: TeamMember
}

const socialLink =
  'inline-flex size-11 items-center justify-center border border-border focus-visible:outline-2 focus-visible:outline-offset-4'

export function TeamCard({ member }: TeamCardProps) {
  return (
    <MastheadEntry name={member.name} role={member.role}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {member.bio}
      </p>
      <FieldNote label="Favorite trail">{member.favoriteTrail}</FieldNote>
      {member.social && (
        <div className="flex gap-3">
          {member.social.instagram && (
            <a
              href={member.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow ${member.name} on Instagram`}
              className={socialLink}
            >
              <Instagram aria-hidden="true" className="size-4" />
            </a>
          )}
          {member.social.email && (
            <a
              href={`mailto:${member.social.email}`}
              aria-label={`Email ${member.name}`}
              className={socialLink}
            >
              <Mail aria-hidden="true" className="size-4" />
            </a>
          )}
        </div>
      )}
    </MastheadEntry>
  )
}
