import type {
  NativeTopoPoint,
  TopoStartAnnotation,
} from '@/lib/kraft/route-annotation-types'
import { startAnnotationAnchor } from '@/lib/kraft/route-annotations'
import styles from './topo.module.css'

type HandNode = {
  point: NativeTopoPoint
  loose: boolean
  hand?: 'left' | 'right'
}

function handNodes(start: TopoStartAnnotation): HandNode[] {
  switch (start.kind) {
    case 'start-zone':
      return []
    case 'matched-hands': {
      if (start.placement.status !== 'reviewed') return []
      return [{ point: start.placement.hold, loose: false }]
    }
    case 'two-required-holds':
      return start.placement.status === 'reviewed'
        ? start.placement.holds.map((point, index) => ({
            point,
            loose: false,
            hand:
              start.placement.status === 'reviewed'
                ? start.placement.handOrder?.[index]
                : undefined,
          }))
        : []
    case 'required-plus-other':
      return start.placement.status === 'reviewed'
        ? [
            { point: start.placement.requiredHold, loose: false },
            ...(start.placement.otherHandRegion
              ? [{ point: start.placement.otherHandRegion, loose: true }]
              : []),
          ]
        : []
    case 'seated-hands-low':
    case 'hands-low':
      return start.placement.status === 'reviewed'
        ? (start.placement.hands ?? []).map((point, index) => ({
            point,
            loose: false,
            hand:
              start.placement.status === 'reviewed'
                ? start.placement.handOrder?.[index]
                : undefined,
          }))
        : []
    case 'two-hands-on-feature':
      return []
  }
}

export function TopoStartAnnotationGlyph({
  start,
  labelPoint,
  size,
}: {
  start: TopoStartAnnotation
  labelPoint: NativeTopoPoint
  size: number
}) {
  const radius = size * 0.27
  const nodes = handNodes(start)
  const approximate =
    start.placement.status !== 'unlocated' &&
    start.placement.precision === 'region'
  const zone = start.placement.status === 'reviewed-region'
  const label = `${approximate ? '~ ' : ''}${zone ? 'start zone' : start.kind === 'matched-hands' ? 'matched start' : start.kind === 'required-plus-other' ? 'start here' : 'start'}`
  const anchor = startAnnotationAnchor(start, labelPoint)
  const labelY =
    Math.min(anchor.y, ...nodes.map(node => node.point.y)) - size * 1.5
  return (
    <g
      data-start-kind={start.kind}
      data-placement={start.placement.status}
      data-precision={
        start.placement.status !== 'unlocated'
          ? start.placement.precision
          : undefined
      }
    >
      <title>
        {start.rule}
        {approximate &&
          nodes.length > 0 &&
          ' Hand symbols identify an approximate starting region, not individual holds.'}
        {start.placement.status === 'reviewed-region' &&
          ' Approximate start region; hand positions are not mapped.'}
        {start.placement.status === 'unlocated' && ` ${start.placement.reason}`}
      </title>
      {zone && (
        <ellipse
          cx={anchor.x}
          cy={anchor.y}
          rx={size * 1.7}
          ry={size * 0.7}
          className={styles.startZone}
          data-start-zone="true"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {nodes.map(({ point, loose, hand }, index) => (
        <g key={`${point.x}-${point.y}-${index}`}>
          <title>
            {hand
              ? `${hand === 'left' ? 'Left' : 'Right'} hand`
              : loose
                ? 'Other hand region'
                : 'Required hand'}
            {approximate ? ', approximate starting region' : ', reviewed start'}
          </title>
          <circle
            cx={point.x}
            cy={point.y}
            r={radius * (loose ? 1.2 : 1)}
            className={loose ? styles.otherHandNode : styles.requiredHandNode}
            data-hand-node={
              loose
                ? 'other-region'
                : start.kind === 'matched-hands'
                  ? 'matched'
                  : 'required'
            }
            data-hand={hand}
            vectorEffect="non-scaling-stroke"
          />
          {hand && (
            <text
              x={point.x}
              y={point.y + size * 1.1}
              textAnchor="middle"
              fontSize={size * 0.9}
              className={styles.startLabel}
              data-hand-label={hand}
            >
              {hand === 'left' ? 'L' : 'R'}
            </text>
          )}
        </g>
      ))}
      <text
        x={anchor.x}
        y={labelY}
        textAnchor="middle"
        fontSize={size * 1.25}
        className={styles.startLabel}
      >
        {label}
      </text>
    </g>
  )
}
