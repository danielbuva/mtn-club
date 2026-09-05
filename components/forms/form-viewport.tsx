'use client'

import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode, useEffect, useRef } from 'react'

export function FormViewport({
  stepId,
  direction,
  children,
}: {
  stepId: string
  direction: number
  children: ReactNode
}) {
  const reducedMotion = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const previous = useRef(stepId)
  useEffect(() => {
    if (previous.current === stepId) return
    previous.current = stepId
    const heading = root.current?.querySelector<HTMLElement>(
      '[data-step-heading]',
    )
    heading?.focus({ preventScroll: true })
    heading?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [stepId])
  return (
    <div ref={root} data-form-viewport className="min-w-0">
      <motion.div
        key={stepId}
        initial={reducedMotion ? false : { opacity: 0, x: direction * 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.16 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
