import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CalendarPageClient } from '@/components/calendar/calendar-page-client'
import type { CalendarTrip, TripTeaserDay } from '@/lib/events/types'

type CalendarPageProps = {
  trips: CalendarTrip[]
  teasers: TripTeaserDay[]
  currentMonth: string
}

export function CalendarPage({ trips, teasers, currentMonth }: CalendarPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CalendarPageClient
        trips={trips}
        teasers={teasers}
        currentMonth={currentMonth}
      />
      <Footer />
    </div>
  )
}
