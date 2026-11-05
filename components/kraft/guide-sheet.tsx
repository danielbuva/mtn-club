'use client'

import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import styles from './topo.module.css'

export type GuideSheetKind = 'climbs' | 'climb' | 'boulder' | null

export function GuideSheet({
  open,
  label,
  title,
  onClose,
  children,
}: {
  open: boolean
  label: string
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) closeButton.current?.focus({ preventScroll: true })
  }, [open])

  return (
    <section className={styles.guideSheet} aria-label={label} hidden={!open}>
      <header className={styles.sheetHeading}>
        <h3>{title}</h3>
        <button
          ref={closeButton}
          type="button"
          aria-label={`Close ${label.toLowerCase()}`}
          onClick={onClose}
        >
          <X size={19} aria-hidden="true" />
        </button>
      </header>
      <div className={styles.sheetBody}>{children}</div>
    </section>
  )
}
