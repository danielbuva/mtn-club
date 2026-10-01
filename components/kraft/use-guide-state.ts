'use client'

import { useEffect, useState } from 'react'
import { type GuideFilters, isGradeBand } from '@/lib/kraft/search'

type GuideState = GuideFilters & {
  boulderId: string | null
  climbId: string | null
  faceId: string | null
  view: 'map' | 'list'
}
const initialState: GuideState = {
  query: '',
  grade: 'all',
  areaId: '',
  boulderId: null,
  climbId: null,
  faceId: null,
  view: 'map',
}

function fromHash(): GuideState {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const grade = params.get('grade') ?? 'all'
  return {
    query: params.get('q') ?? '',
    grade: isGradeBand(grade) ? grade : 'all',
    areaId: params.get('area') ?? '',
    boulderId: params.get('boulder'),
    climbId: params.get('climb'),
    faceId: params.get('face'),
    view:
      params.get('view') === 'list' ||
      (!params.has('view') && Boolean(params.get('q')))
        ? 'list'
        : 'map',
  }
}

export function useGuideState() {
  const [state, setState] = useState<GuideState>(initialState)

  useEffect(() => {
    const sync = () => setState(fromHash())
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  function update(patch: Partial<GuideState>, navigation = false) {
    const next = { ...state, ...patch }
    const params = new URLSearchParams()
    if (next.query) params.set('q', next.query)
    if (next.grade !== 'all') params.set('grade', next.grade)
    if (next.areaId) params.set('area', next.areaId)
    if (next.boulderId) params.set('boulder', next.boulderId)
    if (next.climbId) params.set('climb', next.climbId)
    if (next.faceId) params.set('face', next.faceId)
    params.set('view', next.view)
    const url = `${window.location.pathname}${params.size ? `#${params}` : ''}`
    if (navigation) window.history.pushState(null, '', url)
    else window.history.replaceState(null, '', url)
    setState(next)
  }

  return { state, update }
}
