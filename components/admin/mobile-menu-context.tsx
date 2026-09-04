'use client'

import { createContext, useContext } from 'react'

export const AdminMobileMenuContext = createContext(false)

export function useAdminMobileMenuOpen() {
  return useContext(AdminMobileMenuContext)
}
