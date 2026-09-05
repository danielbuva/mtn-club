'use client'

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

type PublicNavigationState = {
  moreLinks: ReactNode
  animationsReady: boolean
  open: boolean
  toggle: () => void
  close: () => void
}

const PublicNavigationContext = createContext<PublicNavigationState | null>(
  null,
)

export function PublicNavigationStateProvider({
  children,
  moreLinks,
}: {
  children: ReactNode
  moreLinks: ReactNode
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

  const close = () => setOpen(false)

  return (
    <PublicNavigationContext.Provider
      value={{ animationsReady, open, toggle, close, moreLinks }}
    >
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
