import { Badge } from '@/components/ui/badge'
import type { TripActivityType, TripDifficulty } from '@/lib/trips/types'
import { cn } from '@/lib/utils'

const activityLabelMap: Record<TripActivityType, string> = {
  climbing: 'Climbing',
  hiking: 'Hiking',
  camping: 'Camping',
  backpacking: 'Backpacking',
  other: 'Outdoor',
}

const difficultyLabelMap: Record<TripDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
}

const difficultyClasses: Record<TripDifficulty, string> = {
  beginner: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  intermediate: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
  advanced: 'border-orange-500/30 bg-orange-500/10 text-orange-700',
  expert: 'border-red-500/30 bg-red-500/10 text-red-700',
}

type ActivityTagProps = {
  activityType: TripActivityType
  uppercase?: boolean
  onImage?: boolean
  className?: string
}

export function ActivityTag({
  activityType,
  uppercase = false,
  onImage = false,
  className,
}: ActivityTagProps) {
  const label = activityLabelMap[activityType]
  return (
    <Badge
      variant={onImage ? 'default' : 'secondary'}
      className={cn(
        onImage && 'border-white/20 bg-black/40 text-white backdrop-blur',
        className,
      )}
    >
      {uppercase ? label.toUpperCase() : label}
    </Badge>
  )
}

type DifficultyTagProps = {
  difficulty: TripDifficulty
  onImage?: boolean
  className?: string
}

export function DifficultyTag({
  difficulty,
  onImage = false,
  className,
}: DifficultyTagProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        onImage
          ? 'border-white/30 bg-black/30 text-white backdrop-blur'
          : difficultyClasses[difficulty],
        className,
      )}
    >
      {difficultyLabelMap[difficulty]}
    </Badge>
  )
}
