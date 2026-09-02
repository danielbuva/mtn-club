import { ArrowRight, Calendar, Check, Mountain } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ZELLE_PHONE_DISPLAY } from '@/lib/constants'
import { cn } from '@/lib/utils'

const waysToStart = [
  'Join the open community on Discord.',
  'Come to an open weekly meetup.',
  'See official Fall 2026 trips on the public calendar.',
  `Pay annual membership dues through Zelle to ${ZELLE_PHONE_DISPLAY}.`,
]

type HomeCTASectionProps = {
  className?: string
}

export function HomeCTASection({ className }: HomeCTASectionProps) {
  return (
    <section
      id="home-cta"
      className={cn('py-24 px-4 sm:px-6 lg:px-8', className)}
    >
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mx-auto mb-6">
          <Mountain className="w-8 h-8" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
          Find your way into the club
        </h2>

        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Meet people, see what is happening, and come say hello. Becoming a
          member requires $25 dues through Zelle for a 12-month term.
        </p>

        <ul className="text-left max-w-md mx-auto mb-10 space-y-3">
          {waysToStart.map(step => (
            <li key={step} className="flex items-start gap-3">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm text-muted-foreground">{step}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-xl gap-2 px-8">
            <Link href="/join">
              Join the Club
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-xl gap-2 px-8 bg-transparent"
          >
            <Link href="/calendar?view=calendar">
              <Calendar className="w-4 h-4" />
              View Calendar
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
