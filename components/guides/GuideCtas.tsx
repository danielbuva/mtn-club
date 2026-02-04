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
      className={cn('mt-6 md:mt-8 flex flex-col items-end gap-4', className)}
    >
      {visibleLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className="text-base sm:text-xl md:text-2xl font-normal tracking-wide text-foreground/90 transition [text-shadow:0_1px_8px_rgba(0,0,0,0.12)] active:translate-x-0.5 active:opacity-75 text-right"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}
