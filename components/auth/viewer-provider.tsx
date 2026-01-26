'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Viewer } from '@/lib/auth/viewer'

const defaultViewer: Viewer = {
  isAuthenticated: false,
  userId: null,
  email: null,
  isMember: false,
  membershipState: null,
  membershipBannedAt: null,
  member: null,
}

const ViewerContext = createContext<Viewer>(defaultViewer)

type ViewerProviderProps = {
  viewer: Viewer
  children: ReactNode
}

export function ViewerProvider({ viewer, children }: ViewerProviderProps) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>
}

export function useViewer(): Viewer {
  return useContext(ViewerContext)
}
