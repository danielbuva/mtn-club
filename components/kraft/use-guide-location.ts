'use client'

import { useEffect, useState } from 'react'
import { KRAFT_BOUNDS } from '@/lib/kraft/geography'

type Position = {
  lat: number
  lon: number
  accuracy: number
  timestamp: number
}

const FRESH_FOR_MS = 60_000

/** A requested fix is a snapshot, never a claim to track a moving climber. */
export function useGuideLocation() {
  const [position, setPosition] = useState<Position | null>(null)
  const [checkedAt, setCheckedAt] = useState(0)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!position) return
    const timer = window.setInterval(() => setCheckedAt(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [position])

  const age = position ? Math.max(0, checkedAt - position.timestamp) : 0
  const lastKnown = Boolean(position && (age >= FRESH_FOR_MS || error))
  const outside =
    position &&
    (position.lon < KRAFT_BOUNDS.west ||
      position.lon > KRAFT_BOUNDS.east ||
      position.lat < KRAFT_BOUNDS.south ||
      position.lat > KRAFT_BOUNDS.north)
  const ageLabel =
    age < FRESH_FOR_MS
      ? 'just now'
      : `${Math.floor(age / FRESH_FOR_MS)} min ago`
  const fixMessage = position
    ? `${lastKnown ? 'Last known position' : 'Last fix'} · ${ageLabel} · accuracy about ${Math.round(position.accuracy)} m. ${outside ? 'Outside this Kraft map.' : 'Boulder locations have not been field verified.'} Tap Locate me for a new fix.`
    : ''
  const message = locating
    ? 'Finding a new position…'
    : [error, fixMessage].filter(Boolean).join(' ')

  function locate() {
    if (!navigator.geolocation) {
      setError(
        'Your browser cannot share a location. Use the map landmarks instead.',
      )
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      value => {
        const now = Date.now()
        setPosition({
          lat: value.coords.latitude,
          lon: value.coords.longitude,
          accuracy: value.coords.accuracy,
          timestamp: Math.min(now, value.timestamp),
        })
        setCheckedAt(now)
        setError('')
        setLocating(false)
      },
      () => {
        setCheckedAt(Date.now())
        setError(
          'A new location is unavailable. Allow location access or use the parking and trail landmarks.',
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }

  return {
    position: position ? { ...position, lastKnown } : null,
    message,
    locating,
    locate,
  }
}
