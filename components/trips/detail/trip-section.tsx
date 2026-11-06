import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function TripSection({
  id,
  title,
  children,
  className,
}: {
  id: string
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn('space-y-4 border-t border-foreground/80 pt-5', className)}
    >
      <h2
        id={id}
        className="font-brand text-2xl font-bold uppercase leading-none tracking-wide"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-brand text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </p>
  )
}
