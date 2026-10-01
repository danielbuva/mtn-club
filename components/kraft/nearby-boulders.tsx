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
  const neighbors = guide.boulders
    .filter(item => item.id !== boulder.id)
    .map(item => ({ boulder: item, distance: distanceBetween(boulder, item) }))
    .toSorted((a, b) => a.distance - b.distance)
    .slice(0, 3)
  if (neighbors.length === 0) return null

  return (
    <section className={styles.neighbors} aria-label="Boulders nearby">
      <span className={styles.eyebrow}>Boulders nearby</span>
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
        Approximate straight-line distance from published coordinates. This is
        not a walking route.
      </p>
    </section>
  )
}

function distanceBetween(from: Boulder, to: Boulder) {
  const radians = Math.PI / 180
  const latitudeDelta = (to.location.lat - from.location.lat) * radians
  const longitudeDelta = (to.location.lon - from.location.lon) * radians
  const chord =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(from.location.lat * radians) *
      Math.cos(to.location.lat * radians) *
      Math.sin(longitudeDelta / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}
