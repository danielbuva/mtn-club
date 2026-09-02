import type { LucideIcon } from 'lucide-react'

type TripMetaItem = {
  icon: LucideIcon
  text: string
}

type TripMetaRowProps = {
  items: TripMetaItem[]
}

export function TripMetaRow({ items }: TripMetaRowProps) {
  if (!items.length) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      {items.slice(0, 4).map(item => {
        const Icon = item.icon
        return (
          <p
            key={`${item.icon.displayName ?? 'icon'}-${item.text}`}
            className="flex items-center gap-1.5"
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{item.text}</span>
          </p>
        )
      })}
    </div>
  )
}
