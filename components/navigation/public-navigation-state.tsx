'use client'

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type PublicNavigationState = {
  animationsReady: boolean
  open: boolean
  toggle: () => void
}

const PublicNavigationContext = createContext<PublicNavigationState | null>(
  null,
)

export function PublicNavigationStateProvider({
  children,
}: {
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [animationsReady, setAnimationsReady] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimationsReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggle = () => {
    setOpen(current => !current)
  }

  return (
    <PublicNavigationContext.Provider value={{ animationsReady, open, toggle }}>
      {children}
    </PublicNavigationContext.Provider>
  )
}

export function usePublicNavigationState(): PublicNavigationState {
  const value = useContext(PublicNavigationContext)
  if (!value) {
    throw new Error(
      'usePublicNavigationState must be used within PublicNavigationStateProvider.',
    )
  }
  return value
}
