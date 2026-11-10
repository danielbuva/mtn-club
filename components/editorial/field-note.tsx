import type { ReactNode } from 'react'

/** Practical aside with a labeled hairline rule. */
export function FieldNote({
  label = 'Field note',
  children,
}: {
  label?: string
  children: ReactNode
}) {
  return (
    <aside className="space-y-2 border-l border-foreground/50 pl-4">
      <p className="font-brand text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="text-[15px] leading-relaxed text-foreground">
        {children}
      </div>
    </aside>
  )
}
