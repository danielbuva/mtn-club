import type { Boulder, KraftGuide } from '@/lib/kraft/types'
import styles from './topo.module.css'

export function CatalogMemberships({
  guide,
  boulder,
  onSelect,
}: {
  guide: KraftGuide
  boulder: Boulder
  onSelect: (boulderId: string, climbId: string) => void
}) {
  const ownIds = new Set(boulder.climbs.map(climb => climb.id))
  const memberships = (boulder.catalogMemberships ?? []).filter(item =>
    item.climbIds.some(id => !ownIds.has(id)),
  )
  if (!memberships.length) return null
  return (
    <section className={styles.gradeNote} aria-label="Other source memberships">
      <strong>Other source memberships</strong>
      <p>
        These source entries link to existing climb records. Their physical
        parent remains unresolved.
      </p>
      {memberships.map(membership => (
        <div key={membership.sourceId}>
          <p>{membership.note}</p>
          <ul>
            {membership.climbIds
              .filter(id => !ownIds.has(id))
              .map(id => {
                const parent = guide.boulders.find(item =>
                  item.climbs.some(climb => climb.id === id),
                )
                const climb = parent?.climbs.find(item => item.id === id)
                if (!parent || !climb) return null
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() => onSelect(parent.id, id)}
                    >
                      {climb.name} · {climb.grade} · current catalog:{' '}
                      {parent.name}
                    </button>
                  </li>
                )
              })}
          </ul>
        </div>
      ))}
    </section>
  )
}
