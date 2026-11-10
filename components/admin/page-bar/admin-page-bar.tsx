'use client'

import { LayoutDashboard, Pencil } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { type BarContent, barContent } from '@/lib/admin/page-bar-content'
import type { PageEditAccess } from '@/lib/admin/site-pages'

const linkFocus =
  'outline-none focus-visible:ring-2 focus-visible:ring-[#FFECA2] focus-visible:ring-inset'

export function AdminPageBar({
  access,
  ledTripIds,
}: {
  access: PageEditAccess
  ledTripIds: string[]
}) {
  const pathname = usePathname()
  const isEditing = useSearchParams().get('edit') === '1'
  const content = barContent(pathname, isEditing, access, ledTripIds)
  return content ? <AdminPageBarView content={content} /> : null
}

export function AdminPageBarView({ content }: { content: BarContent }) {
  return (
    <aside
      aria-label="Admin tools"
      className="relative z-[46] border-b border-[#F8F1DF]/45 bg-[color:var(--editorial-inverse)] text-[#F8F1DF] print:hidden"
    >
      <div className="mx-auto flex min-h-11 w-full max-w-7xl flex-wrap items-center gap-x-3 pr-1 pl-4 sm:pr-3 sm:pl-6 lg:pl-8">
        <p className="flex min-w-0 items-center gap-2.5">
          <span className="font-brand text-[13px] font-bold uppercase tracking-[0.16em] text-[#F8F1DF]/70">
            Admin
          </span>
          <span className="truncate text-sm font-semibold">{content.name}</span>
          {content.status ? (
            <span className="inline-flex h-6 shrink-0 items-center gap-1.5 border border-[#FFECA2] px-2 font-brand text-[12px] font-bold uppercase tracking-[0.08em] text-[#FFECA2]">
              <Pencil aria-hidden="true" className="size-3" />
              {content.status}
            </span>
          ) : null}
        </p>

        {content.note ? (
          <p className="order-last w-full pb-2.5 text-[13px] leading-5 text-[#F8F1DF]/80 sm:order-none sm:w-auto sm:pb-0">
            {content.note}
          </p>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center">
          {content.action ? (
            <Link
              href={content.action.href}
              className={`group flex h-11 items-center px-1.5 ${linkFocus}`}
            >
              <span className="flex h-8 items-center gap-1.5 bg-[#FFECA2] px-3 font-brand text-[13px] font-bold uppercase tracking-[0.08em] text-[#211D18] transition-colors group-hover:bg-[#F6DC76]">
                <Pencil aria-hidden="true" className="size-3.5" />
                {content.action.label}
              </span>
            </Link>
          ) : null}
          <Link
            href="/admin/pages"
            className={`flex h-11 min-w-11 items-center justify-center gap-2 px-3 text-sm font-semibold underline-offset-4 hover:underline ${linkFocus}`}
          >
            <LayoutDashboard aria-hidden="true" className="size-4" />
            <span
              className={content.action ? 'sr-only sm:not-sr-only' : undefined}
            >
              All pages
            </span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
