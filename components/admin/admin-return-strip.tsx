'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { resolveSitePage } from '@/lib/admin/site-pages'
import { sanitizeReturnTo } from '@/lib/auth/return-to'

const pageName = (returnTo: string) => {
  const current = resolveSitePage(returnTo.split(/[?#]/)[0] ?? returnTo)
  if (!current) return 'the page'
  if (current.kind === 'trip') return 'the trip page'
  if (current.kind === 'notice') return 'the notice'
  return `the ${current.page.name} page`
}

/** Leads back to the public page an admin opened an editor from. */
export function AdminReturnStrip() {
  const returnTo = sanitizeReturnTo(useSearchParams().get('returnTo'))
  if (!returnTo || returnTo.startsWith('/admin')) return null
  return (
    <nav
      aria-label="Return to page"
      className="border-b border-[#211D18]/15 bg-[#F3E8D0] dark:border-border dark:bg-card"
    >
      <Link
        href={returnTo}
        className="mx-auto flex min-h-11 w-full max-w-7xl items-center gap-2 px-5 text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#211D18] sm:px-8 dark:focus-visible:ring-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
        <span className="min-w-0 truncate">Back to {pageName(returnTo)}</span>
      </Link>
    </nav>
  )
}
