import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function initials(name?: string | null) {
  if (!name) return 'MC'
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'MC'
  )
}

/** Decorative avatar: the person's name is always rendered next to it. */
export function PersonAvatar({
  name,
  src,
  className,
}: {
  name?: string | null
  src?: string | null
  className?: string
}) {
  return (
    <Avatar className={cn('size-8 border border-border', className)}>
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback className="bg-card text-[11px] font-semibold text-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
