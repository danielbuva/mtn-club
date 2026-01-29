'use client'

import { useEffect, useMemo } from 'react'

export function useUnsavedChangesPrompt(isDirty: boolean, message?: string) {
  const promptMessage = useMemo(
    () => message ?? 'You have unsaved changes. Discard them?',
    [message]
  )

  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const confirmDiscard = () => {
    if (!isDirty) return true
    return window.confirm(promptMessage)
  }

  return { confirmDiscard }
}
