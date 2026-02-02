'use client'

import { useEffect, useState } from 'react'
import { CalendarSkeleton } from '@/components/calendar/calendar-skeleton'

export default function Loading() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [semester, setSemester] = useState<
    'spring' | 'summer' | 'fall' | 'winter' | 'all'
  >('all')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const viewParam = params.get('view')
    const semesterParam = params.get('semester')
    if (viewParam === 'list' || viewParam === 'calendar') {
      setView(viewParam)
    }
    if (
      semesterParam === 'spring' ||
      semesterParam === 'summer' ||
      semesterParam === 'fall' ||
      semesterParam === 'winter' ||
      semesterParam === 'all'
    ) {
      setSemester(semesterParam)
    }
    const storedView = window.localStorage.getItem('calendar:view')
    if (storedView === 'list' || storedView === 'calendar') {
      setView(storedView)
    }
    const storedSemester = window.localStorage.getItem('calendar:semester')
    if (
      storedSemester === 'spring' ||
      storedSemester === 'summer' ||
      storedSemester === 'fall' ||
      storedSemester === 'winter' ||
      storedSemester === 'all'
    ) {
      setSemester(storedSemester)
    }
  }, [])

  return <CalendarSkeleton view={view} semester={semester} />
}
