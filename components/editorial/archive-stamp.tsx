import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Double-ruled square stamp. Rotation is in degrees; use zero for upright text. */
export function ArchiveStamp({
  children,
  subline,
  tone = 'ink',
  rotate = -3,
  className,
}: {
  children: ReactNode
  subline?: string
  tone?: 'ink' | 'paper'
  rotate?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex w-fit max-w-full items-center border-2 border-current p-1 text-center font-brand font-bold uppercase tracking-[0.12em]',
        tone === 'ink'
          ? 'bg-[#F8F1DF] text-[#211D18]'
          : 'bg-[#211D18] text-[#F8F1DF]',
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-current p-2">
        <span className="text-lg leading-tight">{children}</span>
        {subline && (
          <span className="text-[13px] leading-tight">{subline}</span>
        )}
      </div>
    </div>
  )
}
