import type { CatalogClimbReference } from '@/lib/kraft/search'
import type { Boulder, Climb } from '@/lib/kraft/types'

export function MatchingClimbs({
  boulder,
  climbs,
  references,
  compact,
  onSelect,
}: {
  boulder: Boulder
  climbs: Climb[]
  references: CatalogClimbReference[]
  compact: boolean
  onSelect: (boulderId: string, climbId?: string) => void
}) {
  const entries = [...climbs.map(climb => ({ boulder, climb })), ...references]
  const ordered = compact
    ? entries.toSorted(
        (a, b) =>
          (a.climb.gradeValue ?? Number.POSITIVE_INFINITY) -
            (b.climb.gradeValue ?? Number.POSITIVE_INFINITY) ||
          a.climb.name.localeCompare(b.climb.name),
      )
    : entries
  const visible = compact ? ordered.slice(0, 4) : ordered
  const remaining = compact ? ordered.slice(4) : []

  function rows(items: CatalogClimbReference[]) {
    return items.map(({ boulder: parent, climb }) => (
      <li key={climb.id} data-climb-id={climb.id}>
        <button type="button" onClick={() => onSelect(parent.id, climb.id)}>
          <span>
            {climb.name}
            {parent.id !== boulder.id && (
              <small>
                Current record in {parent.name} · source parent differs
              </small>
            )}
          </span>
          <strong>{climb.grade}</strong>
        </button>
      </li>
    ))
  }

  return (
    <div className="kraft-matching-climbs">
      <ul
        className="kraft-climb-results"
        aria-label={`${boulder.name} climb results`}
      >
        {rows(visible)}
      </ul>
      {remaining.length > 0 && (
        <details className="kraft-more-climb-results">
          <summary>
            {remaining.length} more matching{' '}
            {remaining.length === 1 ? 'climb' : 'climbs'}
          </summary>
          <ul
            className="kraft-climb-results"
            aria-label={`More ${boulder.name} climb results`}
          >
            {rows(remaining)}
          </ul>
        </details>
      )}
    </div>
  )
}
