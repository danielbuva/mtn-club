'use client'

import Link from 'next/link'
import type { MouseEventHandler, ReactNode } from 'react'
import { useViewer } from '@/components/auth/viewer-provider'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type MemberCTAProps = {
  variant?: 'button' | 'link' | 'ghost'
  size?: ButtonProps['size']
  className?: string
  children?: ReactNode
  hideWhenMember?: boolean
  memberFallback?: ReactNode
  icon?: ReactNode
  href?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export function MemberCTA({
  variant = 'button',
  size,
  className,
  children,
  hideWhenMember = true,
  memberFallback,
  icon,
  href = '/membership',
  onClick,
}: MemberCTAProps) {
  const viewer = useViewer()

  if (viewer.isMember) {
    if (memberFallback) {
      return <>{memberFallback}</>
    }
    if (hideWhenMember) {
      return null
    }
  }

  const membershipState = viewer.membershipState
  const hasGoodStanding =
    !!membershipState && !['banned', 'suspended'].includes(membershipState)
  const shouldRenew =
    viewer.isAuthenticated &&
    !viewer.isMember &&
    hasGoodStanding &&
    ['inactive', 'past_due', 'canceled'].includes(membershipState ?? '')

  const label = shouldRenew
    ? 'Renew Membership'
    : viewer.isAuthenticated
      ? 'Activate Membership'
      : 'Become a Member'
  const content = children ?? label
  const contentWithIcon = icon ? (
    <>
      {content}
      {icon}
    </>
  ) : (
    content
  )

  if (variant === 'link') {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'text-sm text-muted-foreground hover:text-foreground transition-colors',
          className,
        )}
      >
        {contentWithIcon}
      </Link>
    )
  }

  const buttonVariant: ButtonProps['variant'] =
    variant === 'ghost' ? 'ghost' : 'default'

  return (
    <Button variant={buttonVariant} size={size} className={className} asChild>
      <Link href={href} onClick={onClick}>
        {contentWithIcon}
      </Link>
    </Button>
  )
}
