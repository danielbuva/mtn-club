import { cn } from '@/lib/utils'

/** The one bullet style for trip and roster lists: an en dash. */
export function DashList({
  items,
  className,
}: {
  items: string[]
  className?: string
}) {
  return (
    <ul className={cn('space-y-1', className)}>
      {items.map(item => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden="true" className="shrink-0 text-muted-foreground">
            –
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}
