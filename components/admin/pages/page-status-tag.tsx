import { Archive, Ban, CircleDot, Clock, PencilLine, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const tones = {
  live: {
    icon: CircleDot,
    className: 'border-[#211D18] bg-[#FFECA2] text-[#211D18]',
  },
  scheduled: {
    icon: Clock,
    className:
      'border-[#211D18]/70 text-[#211D18] dark:border-[#F8F1DF]/70 dark:text-[#F8F1DF]',
  },
  draft: {
    icon: PencilLine,
    className:
      'border-dashed border-[#211D18]/70 text-[#211D18] dark:border-[#F8F1DF]/70 dark:text-[#F8F1DF]',
  },
  canceled: {
    icon: Ban,
    className:
      'border-[#211D18] bg-[#211D18] text-[#F8F1DF] dark:border-[#F8F1DF] dark:bg-[#F8F1DF] dark:text-[#211D18]',
  },
  led: {
    icon: Star,
    className:
      'border-[#211D18]/70 text-[#211D18] dark:border-[#F8F1DF]/70 dark:text-[#F8F1DF]',
  },
  ended: {
    icon: Archive,
    className:
      'border-[#211D18]/25 text-[#6A5146] dark:border-border dark:text-muted-foreground',
  },
} as const

export type PageStatusTone = keyof typeof tones

/** Status in a word and a glyph, so it never depends on color. */
export function PageStatusTag({
  tone,
  children,
  className,
}: {
  tone: PageStatusTone
  children: string
  className?: string
}) {
  const { icon: Icon, className: toneClass } = tones[tone]
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 border px-2 font-brand text-[12px] font-bold uppercase tracking-[0.08em] whitespace-nowrap',
        toneClass,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
      {children}
    </span>
  )
}
