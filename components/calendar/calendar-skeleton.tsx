import Link from 'next/link'
import { addDays, format } from 'date-fns'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { CalendarControls } from '@/components/calendar/calendar-controls'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
type CalendarSkeletonProps = {
  view?: 'calendar' | 'list'
}

export function CalendarSkeleton({ view = 'calendar' }: CalendarSkeletonProps) {
  const isListView = view === 'list'
  const start = new Date(2025, 11, 28)
  const days = Array.from({ length: 35 }, (_, index) => addDays(start, index))

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pt-16">
        <section className="border-b border-border bg-linear-to-b from-muted/40 to-background px-4 py-10 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold sm:text-4xl">Trip Calendar</h1>
              <p className="mt-2 text-muted-foreground">
                Browse adventures, reserve spots, and plan your season in one view.
              </p>
            </div>
            <Card className="border-border/60 bg-card">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Subscribe</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-full gap-2 bg-transparent">
                    <ExternalLink className="h-4 w-4" />
                    iCal
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 bg-transparent">
                    <ExternalLink className="h-4 w-4" />
                    Google Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-4 py-6">
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4 self-start lg:sticky lg:top-24">
              <CalendarControls
                view={isListView ? 'list' : 'calendar'}
                onViewChange={() => {}}
                className="lg:pt-0"
              />

              <Card className="border-border/60 bg-card hidden md:block">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Subscribe</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-full gap-2 bg-transparent">
                      <ExternalLink className="h-4 w-4" />
                      iCal
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full gap-2 bg-transparent">
                      <ExternalLink className="h-4 w-4" />
                      Google Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </aside>

            <div className="min-w-0">
              {isListView ? (
                <div className="calendar-scroll max-h-[70vh] overflow-y-auto pr-2 lg:max-h-[75vh]">
                  <div className="space-y-4">
                    <Card className="p-18 text-center">
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="calendar-scroll calendar-month-scroll max-h-[70vh] overflow-y-auto pr-2 lg:max-h-[75vh]">
                  <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
                    <div className="px-2 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="h-4 w-28 rounded-full bg-muted animate-pulse" />
                        <span className="h-3 w-24 rounded-full bg-muted/40 animate-pulse" />
                      </div>
                      <div className="flex items-center">
                        <div className="hidden md:inline-flex overflow-hidden rounded-full border border-border">
                          <Button variant="ghost" size="icon" className="rounded-none" type="button">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-none border-x border-border h-9 px-4 text-xs"
                            type="button"
                          >
                            Today
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-none" type="button">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full md:hidden"
                        >
                          Today
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 text-xs uppercase tracking-widest text-muted-foreground">
                      {weekDays.map((day) => (
                        <div key={day} className="py-2 text-center">
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-7">
                    {days.map((day, index) => {
                      const dateKey = format(day, 'yyyy-MM-dd')
                      const inMonth = day.getFullYear() === 2026 && day.getMonth() === 0
                      const rowIndex = Math.floor(index / 7)
                      const isLastRow = rowIndex === 4
                      const isLastCol = (index + 1) % 7 === 0
                      return (
                        <div
                          key={dateKey}
                          className={cn(
                            'flex h-24 flex-col gap-2 border-border px-2 py-2 text-left sm:h-28',
                            !isLastRow && 'border-b',
                            !isLastCol && 'border-r',
                            !inMonth && 'text-muted-foreground/60'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full">
                              <span className="h-2 w-4 rounded bg-foreground/20 animate-pulse" />
                            </span>
                          </div>
                          <div className="flex-1" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Link href="#" className="fixed bottom-10 right-6 z-40 inline-flex">
        <Button size="sm" className="rounded-full px-4 shadow-lg">
          + Create Event
        </Button>
      </Link>
    </div>
  )
}
