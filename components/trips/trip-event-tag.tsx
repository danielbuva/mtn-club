import {
  CATEGORY_COLORS,
  getTagCategory,
} from '@/components/calendar/calendar-categories'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function TripEventTag({ tag }: { tag: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent text-[11px] uppercase tracking-wide text-slate-950',
        CATEGORY_COLORS[getTagCategory(tag.trim())],
      )}
    >
      {tag}
    </Badge>
  )
}
