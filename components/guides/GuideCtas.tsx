import Link from 'next/link'
import type { GuideCtaLink } from '@/app/(reader)/guides/types'
import { cn } from '@/lib/utils'

type GuideCtasProps = {
  links: GuideCtaLink[]
  className?: string
}

export function GuideCtas({ links, className }: GuideCtasProps) {
  const visibleLinks = links.filter(link => link.href)
  if (!visibleLinks.length) return null

  return (
    <div
      className={cn('mt-6 md:mt-8 flex flex-col items-end gap-2', className)}
    >
      {visibleLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm text-foreground/80 transition hover:text-foreground text-right"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}
