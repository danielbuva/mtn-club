'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import type { TripPoint } from '@/lib/map/trip-points'

type TripPhotoSheetProps = {
  trip: TripPoint | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TripPhotoSheet({
  trip,
  open,
  onOpenChange,
}: TripPhotoSheetProps) {
  const isMobile = useIsMobile()
  const side = isMobile ? 'bottom' : 'right'
  const description =
    trip?.tags && trip.tags.length > 0
      ? `Highlights: ${trip.tags.join(' · ')}`
      : 'A recent Mountain Club adventure.'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60">
          <SheetTitle className="text-lg">
            {trip?.title ?? 'Trip details'}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {trip?.subtitle ?? 'Select a trip on the map'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="text-sm text-muted-foreground">
            {trip?.occurredOn
              ? `Trip date: ${trip.occurredOn}`
              : 'Photo highlights from recent outings.'}
          </div>
          <p className="text-sm text-foreground/80">{description}</p>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {(trip?.photos ?? []).map(photo => (
              <div
                key={photo}
                className="h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-border/60 shadow-sm"
              >
                <img
                  src={photo}
                  alt={trip?.title ?? 'Trip photo'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
