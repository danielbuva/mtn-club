'use client'
import Link from 'next/link'
import { authLinkClass } from '@/components/auth/form-ui'

export function AuthTransitionLink({
  href,
  disabled,
  children,
}: {
  href: string
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={authLinkClass}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={event => {
        if (disabled) event.preventDefault()
      }}
    >
      {children}
    </Link>
  )
}
