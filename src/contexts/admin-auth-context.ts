import { createContext } from 'react'
import type { AdminRole } from '@/lib/permissions'

export type { AdminRole }

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  /** Set for `doctor` role — links to the doctors table record. */
  doctorId: string | null
}

export interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null)
