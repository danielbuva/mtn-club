import { Instagram, Mail, MapPin } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { INSTAGRAM_URL } from '@/lib/constants'
import type { TeamMember } from '@/lib/data'

interface TeamCardProps {
  member: TeamMember
}

export function TeamCard({ member }: TeamCardProps) {
  return (
    <Card className="group overflow-hidden bg-card border-border/50 hover:border-primary/20 hover:shadow-lg transition-all">
      {/* Photo */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={'/placeholder.svg'}
          alt={member.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <CardContent className="p-5">
        {/* Name & Role */}
        <h3 className="font-semibold text-lg">{member.name}</h3>
        <p className="text-primary text-sm font-medium mb-3">{member.role}</p>

        {/* Bio */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {member.bio}
        </p>

        {/* Favorite Trail */}
        <div className="flex items-start gap-2 text-sm mb-4 p-3 rounded-xl bg-secondary">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="text-muted-foreground">Favorite trail:</span>
            <p className="font-medium">{member.favoriteTrail}</p>
          </div>
        </div>

        {/* Social Links */}
        {member.social && (
          <div className="flex items-center gap-2">
            {member.social.instagram && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl h-9 w-9 bg-transparent"
                asChild
              >
                <a
                  href={INSTAGRAM_URL || 'https://instagram.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow ${member.name} on Instagram`}
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </Button>
            )}
            {member.social.email && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl h-9 w-9 bg-transparent"
                asChild
              >
                <a
                  href={`mailto:${member.social.email}`}
                  aria-label={`Email ${member.name}`}
                >
                  <Mail className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
