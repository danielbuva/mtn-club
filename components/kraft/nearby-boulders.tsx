import { ArrowRight } from 'lucide-react'
import type { Boulder, KraftGuide } from '@/lib/kraft/types'
import styles from './topo.module.css'

export function NearbyBoulders({
  guide,
  boulder,
  onBoulderSelect,
}: {
  guide: KraftGuide
  boulder: Boulder
  onBoulderSelect: (id: string) => void
}) {
  const origin = boulder.location
  if (!origin) return null
  const neighbors = guide.boulders
    .filter(item => item.id !== boulder.id)
    .flatMap(item =>
      item.location
        ? [{ boulder: item, distance: distanceBetween(origin, item.location) }]
        : [],
    )
    .toSorted((a, b) => a.distance - b.distance)
    .slice(0, 3)
  if (neighbors.length === 0) return null

  return (
    <section className={styles.neighbors} aria-label="Boulders nearby">
      <span className={styles.eyebrow}>Nearby source locations</span>
      {neighbors.map(({ boulder: item, distance }) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onBoulderSelect(item.id)}
        >
          <span>{item.name}</span>
          <small>{Math.max(10, Math.round(distance / 10) * 10)} m</small>
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      ))}
      <p className={styles.distanceNote}>
        Approximate straight-line distance between published points. Some
        catalogs cover several rocks; use the source notes to identify them.
        This is not a walking route.
      </p>
    </section>
  )
}

function distanceBetween(
  from: NonNullable<Boulder['location']>,
  to: NonNullable<Boulder['location']>,
) {
  const radians = Math.PI / 180
  const latitudeDelta = (to.lat - from.lat) * radians
  const longitudeDelta = (to.lon - from.lon) * radians
  const chord =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(from.lat * radians) *
      Math.cos(to.lat * radians) *
      Math.sin(longitudeDelta / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}
