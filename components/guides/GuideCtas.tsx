import Link from 'next/link'
import type { GuideCtaLink } from '@/app/(reader)/guides/types'
import { getViewer } from '@/lib/auth/viewer'
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

export function GuideCtasSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('mt-6 md:mt-8 flex flex-col items-end gap-4', className)}
      aria-hidden="true"
      data-guide-ctas-loading
    >
      <span className="inline-flex items-center gap-2">
        <span className="h-6 w-44 animate-pulse bg-foreground/10 md:h-8" />
        <span className="text-base text-foreground/90 sm:text-xl md:text-2xl">
          →
        </span>
      </span>
    </div>
  )
}

export async function MembershipAwareGuideCtas(props: GuideCtasProps) {
  const viewer = await getViewer()
  if (!viewer.isAuthenticated) {
    return <GuideCtas {...props} />
  }

  const links = props.links.map(link =>
    link.href === '/membership-sign-up'
      ? { label: 'Membership status →', href: '/membership' }
      : link,
  )

  return <GuideCtas {...props} links={links} />
}
