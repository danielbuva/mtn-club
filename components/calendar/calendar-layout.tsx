'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CalendarLayoutProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}

export function CalendarLayout({ sidebar, children, className }: CalendarLayoutProps) {
  return (
    <div className={cn('mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]', className)}>
      <aside className="space-y-4 self-start lg:sticky lg:top-24">{sidebar}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
