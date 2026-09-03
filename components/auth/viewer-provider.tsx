'use client'

import { createContext, type ReactNode, useContext } from 'react'
import type { Viewer } from '@/lib/auth/viewer'

const defaultViewer: Viewer = {
  isAuthenticated: false,
  isAdmin: false,
  canCreateEvent: false,
  userId: null,
  email: null,
  isMember: false,
  canViewMemberContent: false,
  membershipAccessLevel: 'none',
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
  return (
    <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>
  )
}

export function useViewer(): Viewer {
  return useContext(ViewerContext)
}
