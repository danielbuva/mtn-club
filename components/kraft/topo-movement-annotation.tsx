import type { TopoMovementAnnotation } from '@/lib/kraft/route-annotation-types'
import styles from './topo.module.css'

export function TopoMovementAnnotationLines({
  movement,
  hitClipPath,
}: {
  movement: TopoMovementAnnotation
  hitClipPath: string
}) {
  if (movement.placement.status !== 'reviewed') return null
  const { start, target, staticPath } = movement.placement
  const dynoPath = `M${start.x} ${start.y}L${target.x} ${target.y}`
  const staticDirection = staticPath
    ?.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ')
  return (
    <g data-movement-kind={movement.kind}>
      <title>{movement.rule}</title>
      {staticDirection && (
        <>
          <path
            d={staticDirection}
            className={styles.staticDirectionLine}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={staticDirection}
            className={styles.routeHitTarget}
            clipPath={hitClipPath}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      <path
        d={dynoPath}
        className={styles.routeLine}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={dynoPath}
        className={styles.routeHitTarget}
        clipPath={hitClipPath}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  )
}

export function TopoMovementAnnotationGlyphs({
  movement,
  size,
}: {
  movement: TopoMovementAnnotation
  size: number
}) {
  if (movement.placement.status !== 'reviewed') return null
  const { start, target, staticPath, precision } = movement.placement
  const radius = size * 0.3
  return (
    <g data-movement-markers={movement.kind}>
      {[start, target].map((point, index) => (
        <path
          key={index === 0 ? 'start' : 'target'}
          d={`M${point.x - radius} ${point.y - radius}l${radius * 2} ${radius * 2}m${-radius * 2} 0l${radius * 2} ${-radius * 2}`}
          className={styles.movementNode}
          data-dyno-node={index === 0 ? 'start' : 'target'}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <text
        x={(start.x + target.x) / 2 + size * 0.35}
        y={(start.y + target.y) / 2}
        fontSize={size * 0.65}
        className={styles.startLabel}
      >
        {precision === 'region' ? '~ dyno' : 'dyno'}
      </text>
      {staticPath && (
        <text
          x={staticPath[0].x + size * 0.45}
          y={staticPath[0].y + size * 0.85}
          fontSize={size * 0.65}
          className={styles.staticDirectionLabel}
        >
          static
        </text>
      )}
    </g>
  )
}
