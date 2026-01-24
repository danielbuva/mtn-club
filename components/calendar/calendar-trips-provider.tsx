'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { CalendarTrip } from '@/lib/events/types'

type CalendarTripsContextValue = {
  trips: CalendarTrip[]
  mergeTrips: (incoming: CalendarTrip[]) => void
}

const CalendarTripsContext = createContext<CalendarTripsContextValue | undefined>(undefined)

type CalendarTripsProviderProps = {
  initialTrips: CalendarTrip[]
  children: ReactNode
}

export function CalendarTripsProvider({ initialTrips, children }: CalendarTripsProviderProps) {
  const [trips, setTrips] = useState<CalendarTrip[]>(() => initialTrips)

  const mergeTrips = useCallback((incoming: CalendarTrip[]) => {
    if (!incoming.length) return
    setTrips((prev) => {
      const seen = new Set(prev.map((trip) => trip.id))
      const merged = [...prev]
      for (const trip of incoming) {
        if (!seen.has(trip.id)) {
          seen.add(trip.id)
          merged.push(trip)
        }
      }
      return merged
    })
  }, [])

  return (
    <CalendarTripsContext.Provider value={{ trips, mergeTrips }}>
      {children}
    </CalendarTripsContext.Provider>
  )
}

export function useCalendarTrips(): CalendarTripsContextValue {
  const context = useContext(CalendarTripsContext)
  if (!context) {
    throw new Error('useCalendarTrips must be used within CalendarTripsProvider')
  }
  return context
}
