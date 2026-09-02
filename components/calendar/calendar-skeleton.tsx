import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarControls } from '@/components/calendar/calendar-controls'
import { CalendarSemesterSelect } from '@/components/calendar/calendar-semester-select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WeeklyMeetupNote } from '@/components/weekly-meetup-note'
import { cn } from '@/lib/utils'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const calendarWeeks = [
  {
    id: 'week-1',
    cells: [
      'blank-1',
      'blank-2',
      'blank-3',
      'blank-4',
      'day-1',
      'day-2',
      'day-3',
    ],
  },
  {
    id: 'week-2',
    cells: ['day-4', 'day-5', 'day-6', 'day-7', 'day-8', 'day-9', 'day-10'],
  },
  {
    id: 'week-3',
    cells: [
      'day-11',
      'day-12',
      'day-13',
      'day-14',
      'day-15',
      'day-16',
      'day-17',
    ],
  },
  {
    id: 'week-4',
    cells: [
      'day-18',
      'day-19',
      'day-20',
      'day-21',
      'day-22',
      'day-23',
      'day-24',
    ],
  },
  {
    id: 'week-5',
    cells: [
      'day-25',
      'day-26',
      'day-27',
      'day-28',
      'day-29',
      'day-30',
      'day-31',
    ],
  },
]
const eventMarkerCells = new Set(['1:2', '2:5', '4:1'])

type CalendarSkeletonProps = {
  view?: 'calendar' | 'list'
  semester?: 'spring' | 'summer' | 'fall' | 'winter' | 'all'
}

export function CalendarSkeleton({
  view = 'calendar',
  semester = 'all',
}: CalendarSkeletonProps) {
  const isListView = view === 'list'

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
            <WeeklyMeetupNote className="text-foreground/80" />
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
                <div className="space-y-3" aria-hidden="true">
                  {[0, 1, 2].map(item => (
                    <div
                      key={item}
                      className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[8rem_1fr]"
                    >
                      <span className="h-5 w-24 animate-pulse bg-muted" />
                      <span className="h-5 w-full max-w-sm animate-pulse bg-muted" />
                    </div>
                  ))}
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

                <div aria-hidden="true">
                  {calendarWeeks.map((week, rowIndex) => (
                    <div
                      key={week.id}
                      className={cn(
                        'grid aspect-[7/1] grid-cols-7 grid-rows-1',
                        rowIndex < calendarWeeks.length - 1 &&
                          'border-b border-border',
                        rowIndex === calendarWeeks.length - 1 && 'mb-3 md:mb-0',
                      )}
                    >
                      {week.cells.map((cell, columnIndex) =>
                        cell.startsWith('day-') ? (
                          <div
                            key={cell}
                            className={cn(
                              'flex h-full min-h-0 min-w-0 flex-col gap-1 overflow-hidden border-r-0 border-border px-0 py-1 md:gap-2 md:border-r md:px-2 md:py-2',
                              columnIndex === 6 && 'md:border-r-0',
                            )}
                          >
                            <div className="flex h-6 flex-none items-center justify-center md:h-7">
                              <span className="h-2 w-3 animate-pulse bg-foreground/20" />
                            </div>
                            {eventMarkerCells.has(
                              `${rowIndex}:${columnIndex}`,
                            ) ? (
                              <div className="flex h-2 w-full flex-none items-center justify-center">
                                <span className="size-2 animate-pulse bg-foreground/15" />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div
                            key={cell}
                            className={cn(
                              'h-full min-h-0 border-r-0 border-border md:border-r',
                              columnIndex === 6 && 'md:border-r-0',
                            )}
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
