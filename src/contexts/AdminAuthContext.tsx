'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildAdminIdentity, getAdminAccess } from '@/lib/supabase/admin'
import { AdminAuthContext, type AdminUser } from './admin-auth-context'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import i18n from '@/i18n/config'

async function resolveAdminUser(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  user: SupabaseUser
): Promise<AdminUser | null> {
  const access = await getAdminAccess(supabase, user.id)
  if (!access) return null
  return buildAdminIdentity(user, access)
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check existing Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        if (!supabase) {
          setIsLoading(false)
          return
        }

        const {
          data: { user: supabaseUser },
        } = await supabase.auth.getUser()
        if (supabaseUser) {
          const adminUser = await resolveAdminUser(supabase, supabaseUser)
          setUser(adminUser)
        }
      } catch (err) {
        console.error('Admin auth session check failed:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user?: SupabaseUser } | null) => {
        if (session?.user) {
          void (async () => {
            const adminUser = await resolveAdminUser(
              supabase,
              session.user as SupabaseUser
            )
            setUser(adminUser)
          })()
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const supabase = createClient()
        if (!supabase) {
          return {
            success: false,
            error: i18n.t('admin.login.errors.unavailable'),
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          // Map Supabase error messages to localized variants
          if (error.message.includes('Invalid login credentials')) {
            return {
              success: false,
              error: i18n.t('admin.login.invalidCredentials'),
            }
          }
          if (error.message.includes('Email not confirmed')) {
            return {
              success: false,
              error: i18n.t('admin.login.errors.emailNotConfirmed'),
            }
          }
          return { success: false, error: i18n.t('admin.login.errors.generic') }
        }

        if (!data.user) {
          return { success: false, error: i18n.t('admin.login.errors.generic') }
        }

        const adminUser = await resolveAdminUser(supabase, data.user)
        if (!adminUser) {
          // Sign out non-admin user from this session
          await supabase.auth.signOut()
          return {
            success: false,
            error: i18n.t('admin.login.errors.noAdminRights'),
          }
        }

        setUser(adminUser)

        return { success: true }
      } catch {
        return { success: false, error: i18n.t('admin.login.errors.generic') }
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      const supabase = createClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error('Admin logout error:', err)
    } finally {
      setUser(null)
    }
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
