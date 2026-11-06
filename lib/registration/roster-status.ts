import type { RegistrationRoster } from './schema'

export type RosterRow = RegistrationRoster['rows'][number]
export type RosterState = RosterRow['state']
export type RosterTone =
  | 'going'
  | 'action'
  | 'queued'
  | 'pending'
  | 'inactive'
  | 'removed'
export type RosterGroup = 'going' | 'offered' | 'waitlist' | 'started' | 'out'

type StatePresentation = {
  label: string
  tone: RosterTone
  group: RosterGroup
  rank: number
}

export function rosterState(state: RosterState): StatePresentation {
  switch (state) {
    case 'confirmed':
      return { label: 'Going', tone: 'going', group: 'going', rank: 0 }
    case 'offered':
      return {
        label: 'Seat offered',
        tone: 'action',
        group: 'offered',
        rank: 1,
      }
    case 'waitlisted':
      return { label: 'Waitlist', tone: 'queued', group: 'waitlist', rank: 2 }
    case 'legacy_review':
      return {
        label: 'Needs review',
        tone: 'action',
        group: 'waitlist',
        rank: 3,
      }
    case 'incomplete':
      return { label: 'Unfinished', tone: 'pending', group: 'started', rank: 4 }
    case 'none':
      return {
        label: 'Guardian review',
        tone: 'pending',
        group: 'started',
        rank: 5,
      }
    case 'maybe':
      return { label: 'Maybe', tone: 'inactive', group: 'started', rank: 6 }
    case 'cancelled':
      return { label: 'Canceled', tone: 'inactive', group: 'out', rank: 7 }
    case 'removed_by_organizer':
      return { label: 'Removed', tone: 'removed', group: 'out', rank: 8 }
    default:
      return assertNever(state)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled registration state: ${String(value)}`)
}

export const rosterGroups = [
  { id: 'going', label: 'Going' },
  { id: 'offered', label: 'Offered' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'started', label: 'Unfinished & maybe' },
  { id: 'out', label: 'Canceled' },
] as const satisfies ReadonlyArray<{ id: RosterGroup; label: string }>

/** Status first (going → out), then queue order, then name. */
export function sortRoster(rows: RosterRow[]): RosterRow[] {
  return [...rows].sort((a, b) => {
    const rank = rosterState(a.state).rank - rosterState(b.state).rank
    if (rank) return rank
    if (a.state === 'waitlisted' && a.queuedAt && b.queuedAt)
      return a.queuedAt.localeCompare(b.queuedAt)
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  })
}

/** "First Last", or null when either part is missing. */
export function fullName(row: Pick<RosterRow, 'firstName' | 'lastName'>) {
  const first = row.firstName?.trim()
  const last = row.lastName?.trim()
  return first && last ? `${first} ${last}` : null
}

/** Organizers scan for real people: full name first, display name as a fallback. */
export function rosterNames(
  row: Pick<RosterRow, 'name' | 'firstName' | 'lastName'>,
) {
  const full = fullName(row)
  if (!full) return { primary: row.name, secondary: null }
  return {
    primary: full,
    secondary:
      full.toLowerCase() === row.name.trim().toLowerCase() ? null : row.name,
  }
}

export function matchesRosterSearch(row: RosterRow, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [row.name, row.firstName, row.lastName, fullName(row), row.email]
    .filter((value): value is string => Boolean(value))
    .some(value => value.toLowerCase().includes(needle))
}
