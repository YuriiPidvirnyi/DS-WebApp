'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from './useLiveChat'

export interface ChatSession {
  id: string
  patient_id: string | null
  visitor_id: string | null
  visitor_name: string | null
  status: 'active' | 'closed'
  created_at: string
  updated_at: string
  last_message: string | null
  unread_count: number
}

/**
 * Hook for admin-side live chat management via Supabase Realtime.
 *
 * Subscribes to:
 * - chat_sessions changes (new sessions, updates)
 * - chat_messages for the selected session
 */
export function useAdminChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const messageChannelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof createClient>>['channel']
  > | null>(null)

  // Stable reference — createClient() is a singleton
  const supabase = useMemo(
    () => (typeof window !== 'undefined' ? createClient() : null),
    []
  )

  // Load all sessions
  const loadSessions = useCallback(async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (data) setSessions(data as ChatSession[])
  }, [supabase])

  // Initial load
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Subscribe to session changes (new sessions, status updates)
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel('admin:sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions',
        },
        () => {
          // Reload all sessions on any change
          loadSessions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadSessions])

  // Load messages for active session
  useEffect(() => {
    if (!activeSessionId || !supabase) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data as ChatMessage[])

      // Reset unread count when admin opens session
      await supabase
        .from('chat_sessions')
        .update({ unread_count: 0 })
        .eq('id', activeSessionId)
    }

    loadMessages()
  }, [activeSessionId, supabase])

  // Subscribe to messages for active session
  useEffect(() => {
    if (!activeSessionId || !supabase) return

    // Clean up previous subscription
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current)
    }

    const channel = supabase
      .channel(`admin:messages:${activeSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${activeSessionId}`,
        },
        (payload: { new: unknown }) => {
          const msg = payload.new as unknown as ChatMessage
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    messageChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      messageChannelRef.current = null
    }
  }, [activeSessionId, supabase])

  /** Send a message as admin */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!supabase || !activeSessionId || !content.trim()) return

      const { data: userData } = await supabase.auth.getUser()

      const optimistic: ChatMessage = {
        id: `temp_${Date.now()}`,
        session_id: activeSessionId,
        sender: 'admin',
        content: content.trim(),
        created_at: new Date().toISOString(),
      }

      setMessages(prev => [...prev, optimistic])

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: activeSessionId,
          sender: 'admin',
          admin_id: userData?.user?.id || null,
          content: content.trim(),
        })
        .select('*')
        .single()

      if (error) {
        console.error('[AdminChat] Failed to send:', error)
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        return
      }

      if (data) {
        setMessages(prev =>
          prev.map(m => (m.id === optimistic.id ? (data as ChatMessage) : m))
        )
      }
    },
    [supabase, activeSessionId]
  )

  /** Close a session */
  const closeSession = useCallback(
    async (sessionId: string) => {
      if (!supabase) return
      await supabase
        .from('chat_sessions')
        .update({ status: 'closed' })
        .eq('id', sessionId)

      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }

      loadSessions()
    },
    [supabase, activeSessionId, loadSessions]
  )

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    isConnected,
    sendMessage,
    closeSession,
  }
}
