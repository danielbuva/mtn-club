import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Edition eyebrow on a solid ink plate, or an outline inheriting its text color. */
export function EditionLabel({
  children,
  variant = 'outline',
  className,
}: {
  children: ReactNode
  variant?: 'solid' | 'outline'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block border px-2 py-1 font-brand text-[13px] font-bold uppercase tracking-[0.14em]',
        variant === 'solid'
          ? 'border-[#211D18] bg-[#211D18] text-[#FFECA2]'
          : 'border-current',
        className,
      )}
    >
      {children}
    </span>
  )
}
