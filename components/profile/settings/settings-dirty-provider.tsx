'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { useUnsavedChangesPrompt } from '@/components/profile/settings/use-unsaved-changes'

type SettingsDirtyContextValue = {
  isDirty: boolean
  setIsDirty: (value: boolean) => void
  confirmDiscard: () => boolean
}

const SettingsDirtyContext = createContext<SettingsDirtyContextValue | null>(
  null,
)

export function SettingsDirtyProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDirty, setIsDirty] = useState(false)
  const { confirmDiscard } = useUnsavedChangesPrompt(isDirty)

  const value = useMemo(
    () => ({
      isDirty,
      setIsDirty,
      confirmDiscard,
    }),
    [isDirty, confirmDiscard],
  )

  return (
    <SettingsDirtyContext.Provider value={value}>
      {children}
    </SettingsDirtyContext.Provider>
  )
}

export function useSettingsDirty() {
  const context = useContext(SettingsDirtyContext)
  if (!context) {
    throw new Error(
      'useSettingsDirty must be used within SettingsDirtyProvider',
    )
  }
  return context
}
