'use client'

import { useState } from 'react'

export function useFormNavigation(stepIds: readonly string[]) {
  const [requested, setRequested] = useState(stepIds[0] ?? '')
  const [direction, setDirection] = useState(1)
  const index = Math.max(0, stepIds.indexOf(requested))
  const current = stepIds[index] ?? ''
  function goTo(id: string) {
    const nextIndex = stepIds.indexOf(id)
    if (nextIndex < 0) return
    setDirection(nextIndex < index ? -1 : 1)
    setRequested(id)
  }
  return {
    current,
    index,
    direction,
    count: stepIds.length,
    isLast: index === stepIds.length - 1,
    goTo,
    back: () => goTo(stepIds[Math.max(0, index - 1)] ?? current),
    next: () =>
      goTo(stepIds[Math.min(stepIds.length - 1, index + 1)] ?? current),
  }
}

export function focusFormError(root: HTMLElement | null) {
  requestAnimationFrame(() => {
    const field =
      root?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      root?.querySelector<HTMLElement>(
        'input:invalid, textarea:invalid, select:invalid',
      )
    field?.focus()
  })
}
