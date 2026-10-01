'use client'

import { useEffect, useRef } from 'react'
import type { Boulder, KraftGuide } from '@/lib/kraft/types'
import { BoulderDetail } from './boulder-detail'

export function GuideDialog({
  guide,
  boulder,
  climbId,
  faceId,
  onSelectFace,
  onSelectClimb,
  onClose,
  onSelectBoulder,
}: {
  guide: KraftGuide
  boulder: Boulder | undefined
  climbId: string | null
  faceId: string | null
  onSelectFace: (id: string, climbId: string | null) => void
  onSelectClimb: (id: string | null) => void
  onClose: () => void
  onSelectBoulder: (id: string, climbId?: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const returnFocus = useRef<HTMLElement | SVGElement | null>(null)
  const isOpen = Boolean(boulder)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      const active = document.activeElement
      returnFocus.current =
        active !== document.body &&
        (active instanceof HTMLElement || active instanceof SVGElement)
          ? active
          : null
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
      if (returnFocus.current?.isConnected)
        returnFocus.current.focus({ preventScroll: true })
      else document.getElementById('kraft-title')?.focus()
    }
  }, [isOpen])

  // Focus only after showModal() makes the heading available to the keyboard.
  useEffect(() => {
    if (!boulder?.id || !dialogRef.current?.open) return
    dialogRef.current.scrollTop = 0
    headingRef.current?.focus({ preventScroll: true })
  }, [boulder?.id])

  return (
    <dialog
      ref={dialogRef}
      className="kraft-detail-dialog"
      aria-label={boulder ? `${boulder.name} boulder guide` : 'Boulder guide'}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
    >
      {boulder && (
        <BoulderDetail
          key={boulder.id}
          guide={guide}
          boulder={boulder}
          headingRef={headingRef}
          selectedClimbId={climbId}
          selectedFaceId={faceId}
          onFaceSelect={onSelectFace}
          onClimbSelect={onSelectClimb}
          onClose={onClose}
          onBoulderSelect={onSelectBoulder}
          onReferenceSelect={onSelectBoulder}
        />
      )}
    </dialog>
  )
}
