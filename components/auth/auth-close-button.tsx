'use client'
import { X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getReturnToFromSearchParams } from '@/lib/auth/return-to'

function CloseLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Close and return to the site"
      className="flex size-12 shrink-0 items-center justify-center border border-foreground/20 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
    >
      <X className="size-5" aria-hidden="true" />
    </Link>
  )
}
export function AuthCloseButton() {
  const params = useSearchParams()
  return <CloseLink href={getReturnToFromSearchParams(params) ?? '/'} />
}
export function AuthCloseFallback() {
  return <CloseLink href="/" />
}
