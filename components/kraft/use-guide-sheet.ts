'use client'

import { type KeyboardEvent, useRef, useState } from 'react'
import type { GuideSheetKind } from './guide-sheet'

export function useGuideSheet() {
  const [activeSheet, setActiveSheet] = useState<GuideSheetKind>(null)
  const openingControl = useRef<HTMLElement | null>(null)

  function openSheet(
    sheet: Exclude<GuideSheetKind, null>,
    control: HTMLButtonElement,
  ) {
    openingControl.current = control
    setActiveSheet(sheet)
  }

  function closeSheet() {
    setActiveSheet(null)
    if (openingControl.current?.isConnected)
      openingControl.current.focus({ preventScroll: true })
    openingControl.current = null
  }

  function dismissSheet() {
    setActiveSheet(null)
    openingControl.current = null
  }

  function onKeyDownCapture(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Escape' || !activeSheet) return
    event.preventDefault()
    event.stopPropagation()
    closeSheet()
  }

  return {
    activeSheet,
    openSheet,
    closeSheet,
    dismissSheet,
    onKeyDownCapture,
  }
}
