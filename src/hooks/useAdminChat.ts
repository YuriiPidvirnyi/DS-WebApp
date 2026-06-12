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
  const [isPeerTyping, setIsPeerTyping] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const messageChannelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof createClient>>['channel']
  > | null>(null)
  const typingChannelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof createClient>>['channel']
  > | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(0)
  const wasDisconnectedRef = useRef(false)

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

  // Load messages for active session (and after reconnects, to catch up
  // on anything missed while the channel was down)
  const loadMessages = useCallback(async () => {
    if (!activeSessionId || !supabase) return

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
  }, [activeSessionId, supabase])

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }
    loadMessages()
  }, [activeSessionId, loadMessages])

  // Subscribe to messages for active session
  useEffect(() => {
    if (!activeSessionId || !supabase) return

    // Clean up previous subscription
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current)
    }

    let retryTimer: ReturnType<typeof setTimeout> | null = null

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
        if (status === 'SUBSCRIBED') {
          if (wasDisconnectedRef.current) {
            wasDisconnectedRef.current = false
            loadMessages()
          }
          return
        }
        wasDisconnectedRef.current = true
        // Channel errors are not always auto-rejoined — rebuild the channel.
        if (
          (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') &&
          !retryTimer
        ) {
          retryTimer = setTimeout(() => setRetryNonce(n => n + 1), 5000)
        }
      })

    messageChannelRef.current = channel

    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      supabase.removeChannel(channel)
      messageChannelRef.current = null
      setIsConnected(false)
    }
  }, [activeSessionId, supabase, retryNonce, loadMessages])

  // Shared broadcast channel for typing indicators (admin <-> patient)
  useEffect(() => {
    if (!activeSessionId || !supabase) return

    const channel = supabase
      .channel(`chat-typing:${activeSessionId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (message: { payload?: { sender?: string } }) => {
          if (message.payload?.sender !== 'patient') return
          setIsPeerTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(
            () => setIsPeerTyping(false),
            3000
          )
        }
      )
      .subscribe()

    typingChannelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      typingChannelRef.current = null
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      setIsPeerTyping(false)
    }
  }, [activeSessionId, supabase])

  /** Broadcast that the admin is typing (throttled). */
  const notifyTyping = useCallback(() => {
    const channel = typingChannelRef.current
    if (!channel) return
    const now = Date.now()
    if (now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: 'admin' },
    })
  }, [])

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
    isPeerTyping,
    notifyTyping,
    sendMessage,
    closeSession,
  }
}
