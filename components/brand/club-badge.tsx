import type { SVGProps } from 'react'
import {
  BADGE_ART_PATH,
  BADGE_PLATE_PATH,
} from '@/components/brand/club-badge-paths'

/** Width / height of the badge, for sizing wrappers without layout shift. */
export const CLUB_BADGE_ASPECT = 1914 / 1004

type ClubBadgeProps = Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'children'> & {
  /**
   * Accessible name. Leave it out when nearby text or a parent link already
   * names the club, and the badge is hidden from assistive tech.
   */
  title?: string
}

/**
 * The official red club badge. The plate is a self-contained shape with fixed
 * colors, so it reads the same on paper, ink, photos, and in dark mode.
 */
export function ClubBadge({ title, className, ...props }: ClubBadgeProps) {
  const labelled = Boolean(title)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1914 1004"
      className={className}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...props}
    >
      <g transform="translate(0 1004) scale(.1 -.1)">
        <path fill="#D40000" d={BADGE_PLATE_PATH} />
        <path fill="#FFFFFF" d={BADGE_ART_PATH} />
      </g>
    </svg>
  )
}
