import { addDays, format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarControls } from '@/components/calendar/calendar-controls'
import { CalendarSemesterSelect } from '@/components/calendar/calendar-semester-select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
type CalendarSkeletonProps = {
  view?: 'calendar' | 'list'
  semester?: 'spring' | 'summer' | 'fall' | 'winter' | 'all'
}

export function CalendarSkeleton({
  view = 'calendar',
  semester = 'all',
}: CalendarSkeletonProps) {
  const isListView = view === 'list'
  const start = new Date(2025, 11, 28)
  const days = Array.from({ length: 35 }, (_, index) => addDays(start, index))

  return (
    <div
      data-calendar-page
      className="min-h-screen flex flex-col bg-background text-foreground"
    >
      <main className="flex-1">
        <section className="public-page-top border-b border-border bg-linear-to-b from-muted/40 to-background px-4 pb-10 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-brand text-4xl uppercase leading-[0.92] sm:text-5xl">
                Trip Calendar
              </h1>
              <p className="mt-2 text-muted-foreground">
                Official dates are public. Exact meetup points, requirements,
                RSVPs, and schedule changes are announced in Discord.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-6 pt-6 md:pt-12">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <CalendarControls
                  view={isListView ? 'list' : 'calendar'}
                  onViewChange={() => {}}
                />
                {isListView && (
                  <div className="hidden h-9 items-center gap-0 border border-border bg-card px-0 text-sm text-muted-foreground md:inline-flex">
                    <span className="pl-3 text-foreground/70">Semester</span>
                    <span className="ml-2 mr-0 h-4 w-px bg-border" />
                    <CalendarSemesterSelect
                      value={semester}
                      onChange={() => {}}
                      triggerClassName="h-7 w-28 rounded-none border-0 bg-transparent pl-2 pr-3 shadow-none justify-between"
                    />
                  </div>
                )}
              </div>
            </div>

            {isListView && (
              <Card className="rounded-none border border-border bg-card p-4 md:hidden">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Semester
                </p>
                <div className="mt-3">
                  <CalendarSemesterSelect
                    value={semester}
                    onChange={() => {}}
                    triggerClassName="w-full rounded-none"
                  />
                </div>
              </Card>
            )}

            {isListView ? (
              <div className="calendar-scroll max-h-[70vh] overflow-y-auto pr-2 lg:max-h-[75vh]">
                <div className="space-y-4">
                  <Card className="rounded-none p-12 text-center">
                    <p className="text-muted-foreground">
                      No trips match your filters.
                    </p>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="calendar-scroll calendar-month-scroll max-h-[70vh] overflow-y-auto pr-2 lg:max-h-[75vh]">
                <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
                  <div className="px-2 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="h-4 w-28 bg-muted animate-pulse" />
                      <span className="h-3 w-24 bg-muted/40 animate-pulse" />
                    </div>
                    <div className="flex items-center">
                      <div className="hidden overflow-hidden border border-border md:inline-flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-none"
                          type="button"
                        >
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-none"
                          type="button"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-none md:hidden"
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 text-xs uppercase tracking-widest text-muted-foreground">
                    {weekDays.map(day => (
                      <div key={day} className="py-2 text-center">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-7">
                  {days.map((day, index) => {
                    const dateKey = format(day, 'yyyy-MM-dd')
                    const inMonth =
                      day.getFullYear() === 2026 && day.getMonth() === 0
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
                          !inMonth && 'text-muted-foreground/60',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex h-7 w-7 items-center justify-center">
                            <span className="h-2 w-4 bg-foreground/20 animate-pulse" />
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
        </section>
      </main>
    </div>
  )
}
