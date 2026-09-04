'use client'

import { useSearchParams } from 'next/navigation'
import { TripFilters } from './trips-filters'

export function TripFilterToolbar() {
  const params = useSearchParams()
  const filters = {
    q: params.get('q') ?? undefined,
    timing: params.get('timing') ?? undefined,
    kind: params.get('kind') ?? undefined,
    lifecycle: params.get('lifecycle') ?? undefined,
  }
  return <TripFilters key={params.toString()} filters={filters} />
}
