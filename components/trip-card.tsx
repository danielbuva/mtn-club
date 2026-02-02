'use client'

import { Calendar, Lock, MapPin, Mountain, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateRange } from '@/lib/events/formatters'
import type { CalendarTrip } from '@/lib/events/types'
import { cn } from '@/lib/utils'

interface TripCardProps {
  trip: CalendarTrip
  onClick?: () => void
  variant?: 'default' | 'compact'
  className?: string
}

const difficultyColors: Record<CalendarTrip['difficulty'], string> = {
  Easy: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Moderate:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Challenging:
    'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  Expert: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
}

export function TripCard({
  trip,
  onClick,
  variant = 'default',
  className,
}: TripCardProps) {
  const isCompact = variant === 'compact'
  const imageSizes = isCompact
    ? '96px'
    : '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw'

  return (
    <Card
      className={cn(
        'group overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/20 bg-card',
        isCompact ? 'flex-row flex' : '',
        className,
      )}
      onClick={onClick}
    >
      {/* Image */}
      <div
        className={cn(
          'relative overflow-hidden bg-muted',
          isCompact ? 'w-24 h-24 shrink-0' : 'aspect-4/3',
        )}
      >
        <Image
          src={
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop'
          }
          alt={trip.title}
          fill
          sizes={imageSizes}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {trip.membersOnly && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="bg-background/90 backdrop-blur-sm gap-1"
            >
              <Lock className="w-3 h-3" />
              Members
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent
        className={cn(
          'flex flex-col',
          isCompact ? 'p-3 justify-center' : 'p-4',
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className={cn(
              'font-semibold leading-tight text-balance',
              isCompact ? 'text-sm' : 'text-lg',
            )}
          >
            {trip.title}
          </h3>
          {!isCompact && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-xs',
                difficultyColors[trip.difficulty],
              )}
            >
              {trip.difficulty}
            </Badge>
          )}
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground',
            isCompact ? 'text-xs' : 'text-sm',
          )}
        >
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {trip.state}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateRange(trip.dateStart, trip.dateEnd)}
          </span>
        </div>

        {!isCompact && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mountain className="w-4 h-4" />
              {trip.miles === null ? 'TBD' : `${trip.miles} mi`}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trip.elevationGain === null
                ? 'TBD'
                : `${trip.elevationGain.toLocaleString()} ft`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
