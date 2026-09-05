import type { LucideIcon } from 'lucide-react'
import { TripTitleText } from '@/components/trips/trip-title-text'

type TripMetaItem = {
  icon: LucideIcon
  text: string
  canceled?: boolean
}

type TripMetaRowProps = {
  location: TripMetaItem
  date: TripMetaItem
  time: TripMetaItem
}

function MetaItem({ icon: Icon, text, canceled = false }: TripMetaItem) {
  return (
    <p className="flex min-w-0 items-center gap-1.5">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate">
        <TripTitleText title={text} canceled={canceled} />
      </span>
    </p>
  )
}

export function TripMetaRow({ location, date, time }: TripMetaRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <div className="flex min-w-0 max-w-full items-center gap-4 whitespace-nowrap">
        <MetaItem {...date} />
        <div className="shrink-0">
          <MetaItem {...time} />
        </div>
      </div>
      <MetaItem {...location} />
    </div>
  )
}
