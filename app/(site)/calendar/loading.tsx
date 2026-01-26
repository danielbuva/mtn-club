'use client'

import { useEffect, useState } from 'react'
import { CalendarSkeleton } from '@/components/calendar/calendar-skeleton'

export default function Loading() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const viewParam = params.get('view')
    if (viewParam === 'list' || viewParam === 'calendar') {
      setView(viewParam)
      return
    }
    const storedView = window.localStorage.getItem('calendar:view')
    if (storedView === 'list' || storedView === 'calendar') {
      setView(storedView)
    }
  }, [])

  return <CalendarSkeleton view={view} />
}
