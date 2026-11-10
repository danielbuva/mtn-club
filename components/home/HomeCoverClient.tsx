'use client'

import { CoverRotation } from '@/components/home/cover-rotation'

export type HomeCoverClientProps = {
  transitionDurationMs: number
  initialIndex?: number
}

export function HomeCoverClient(props: HomeCoverClientProps) {
  return <CoverRotation {...props} />
}
