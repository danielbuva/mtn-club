import Link from 'next/link'
import {
  type FieldGuideId,
  fieldGuides,
} from '@/app/(reader)/guides/field-guides'
import type { GuideCtaLink } from '@/app/(reader)/guides/types'
import { getViewer } from '@/lib/auth/viewer'
import { cn } from '@/lib/utils'

function guideLinkLabel(link: GuideCtaLink, style?: 'guide-index') {
  if (style !== 'guide-index') return link.label
  const id = link.href.split('#')[0].slice(1)
  if (!Object.hasOwn(fieldGuides, id)) return link.label
  const guide = fieldGuides[id as FieldGuideId] // Own-key check above narrows the registry lookup.
  return `Field Guide No. ${guide.number} · ${guide.topic} →`
}

type GuideCtasProps = {
  links: GuideCtaLink[]
  className?: string
  style?: 'guide-index'
}

export function GuideCtas({ links, className, style }: GuideCtasProps) {
  const visibleLinks = links.filter(link => link.href)
  if (!visibleLinks.length) return null

  return (
    <div
      className={cn(
        'mt-6 flex flex-col border-t border-border pt-3',
        className,
      )}
    >
      {visibleLinks.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex min-h-11 items-center py-2 font-brand text-base font-bold uppercase tracking-wide text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {guideLinkLabel(link, style)}
        </Link>
      ))}
    </div>
  )
}

export function GuideCtasSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col border-t border-border pt-3',
        className,
      )}
      aria-hidden="true"
      data-guide-ctas-loading
    >
      <span className="inline-flex min-h-11 items-center gap-2">
        <span className="h-5 w-64 max-w-full bg-foreground/10 motion-safe:animate-pulse" />
        <span className="text-base text-foreground">→</span>
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
