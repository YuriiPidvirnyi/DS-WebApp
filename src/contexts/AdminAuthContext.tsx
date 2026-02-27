'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'superadmin'
}

interface AdminAuthContextType {
  user: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

// Simple hash function for demo (in production, use bcrypt on server)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Demo admin credentials (in production, this would be in a database)
const DEMO_ADMIN = {
  id: 'admin-1',
  email: 'admin@dentalstory.ua',
  name: 'Admin',
  role: 'admin' as const,
  // Password: "Admin123!" - SHA256 hashed
  passwordHash: '240be518fabd2724ddb6f04eeb9d6d8051e0e6c1c7e5b9c2a4b8d4e0f1a2b3c4',
}

const AUTH_STORAGE_KEY = 'dental_admin_auth'
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours

interface StoredSession {
  user: AdminUser
  expiresAt: number
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) {
          const session: StoredSession = JSON.parse(stored)
          if (session.expiresAt > Date.now()) {
            setUser(session.user)
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY)
          }
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // In production, this would be an API call
      const hashedInput = await hashPassword(password)
      
      // Demo validation (in production, validate against database via API)
      if (email.toLowerCase() === DEMO_ADMIN.email && hashedInput === DEMO_ADMIN.passwordHash) {
        const adminUser: AdminUser = {
          id: DEMO_ADMIN.id,
          email: DEMO_ADMIN.email,
          name: DEMO_ADMIN.name,
          role: DEMO_ADMIN.role,
        }

        const session: StoredSession = {
          user: adminUser,
          expiresAt: Date.now() + SESSION_DURATION,
        }

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
        setUser(adminUser)

        return { success: true }
      }

      return { success: false, error: 'Невірний email або пароль' }
    } catch {
      return { success: false, error: 'Помилка входу. Спробуйте пізніше.' }
    }
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
