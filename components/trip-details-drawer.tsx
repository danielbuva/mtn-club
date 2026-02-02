'use client'

import {
  Calendar,
  CalendarPlus,
  Clock,
  Lock,
  MapPin,
  Mountain,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDateRange } from '@/lib/events/formatters'
import type { CalendarTrip } from '@/lib/events/types'
import { cn } from '@/lib/utils'

interface TripDetailsDrawerProps {
  trip: CalendarTrip | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const difficultyColors: Record<CalendarTrip['difficulty'], string> = {
  Easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Moderate:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Challenging:
    'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  Expert: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
}

const tripImages = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&h=600&fit=crop',
]

export function TripDetailsDrawer({
  trip,
  open,
  onOpenChange,
}: TripDetailsDrawerProps) {
  if (!trip) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 overflow-y-auto"
      >
        <div className="relative">
          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </button>

          {/* Hero Image */}
          <div className="relative aspect-16/10 bg-muted">
            <Image
              src={tripImages[0] || '/placeholder.svg'}
              alt={trip.title}
              fill
              sizes="100vw"
              className="object-cover"
            />
            {trip.membersOnly && (
              <div className="absolute top-4 left-4">
                <Badge
                  variant="secondary"
                  className="bg-background/90 backdrop-blur-sm gap-1"
                >
                  <Lock className="w-3 h-3" />
                  Members Only
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <SheetHeader className="text-left p-0 mb-4">
              <div className="flex items-start justify-between gap-3">
                <SheetTitle className="text-2xl font-bold leading-tight text-balance">
                  {trip.title}
                </SheetTitle>
                <Badge
                  variant="outline"
                  className={cn('shrink-0', difficultyColors[trip.difficulty])}
                >
                  {trip.difficulty}
                </Badge>
              </div>
            </SheetHeader>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-sm">{trip.state}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-sm">
                    {formatDateRange(trip.dateStart, trip.dateEnd)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                <Mountain className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-medium text-sm">
                    {trip.miles === null ? 'TBD' : `${trip.miles} miles`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Elevation</p>
                  <p className="font-medium text-sm">
                    {trip.elevationGain === null
                      ? 'TBD'
                      : `${trip.elevationGain.toLocaleString()} ft`}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">About This Trip</h3>
              <p className="text-muted-foreground leading-relaxed">
                {trip.description}
              </p>
            </div>

            {/* Meeting Details */}
            <div className="mb-6 p-4 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-3">Meeting Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{trip.meetingTime}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{trip.meetingLocation}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {trip.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Photo Gallery */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3">Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                {tripImages.map((img, i) => (
                  <div
                    key={img}
                    className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                  >
                    <Image
                      src={img || '/placeholder.svg'}
                      alt={`${trip.title} photo ${i + 1}`}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-3 rounded-xl bg-transparent"
              >
                View Full Album
              </Button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button size="lg" className="rounded-xl gap-2">
                <Users className="w-4 h-4" />
                RSVP for This Trip
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl gap-2 bg-transparent"
              >
                <CalendarPlus className="w-4 h-4" />
                Add to Calendar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
