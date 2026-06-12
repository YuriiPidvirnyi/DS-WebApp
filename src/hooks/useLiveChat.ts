'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  trackEvent,
  ChatEvent,
  AnalyticsEventCategory,
} from '@/utils/analytics'

export interface ChatMessage {
  id: string
  session_id: string
  sender: 'patient' | 'admin' | 'system'
  content: string
  created_at: string
}

interface UseLiveChatOptions {
  /** If true, the hook is active and will connect */
  enabled: boolean
}

/**
 * Hook for patient-side live chat via Supabase Realtime.
 *
 * Flow:
 * 1. On first message, creates a chat_session
 * 2. Subscribes to new messages via Realtime
 * 3. Provides sendMessage() for the UI
 */
export function useLiveChat({ enabled }: UseLiveChatOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [isPeerTyping, setIsPeerTyping] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const channelRef = useRef<ReturnType<
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

  // Determine whether current user can use live chat.
  useEffect(() => {
    if (!enabled || !supabase) return

    const checkAuth = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setRequiresAuth(!userData?.user?.id)
    }

    checkAuth()
  }, [enabled, supabase])

  // Restore session from sessionStorage
  useEffect(() => {
    if (!enabled) return
    const stored = sessionStorage.getItem('ds_chat_session')
    if (stored) setSessionId(stored)
  }, [enabled])

  // Load existing messages when session is known (and after reconnects,
  // to catch up on anything missed while the channel was down)
  const loadMessages = useCallback(async () => {
    if (!sessionId || !supabase) return
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (data) setMessages(data as ChatMessage[])
  }, [sessionId, supabase])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Subscribe to Realtime
  useEffect(() => {
    if (!sessionId || !supabase || !enabled) return

    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: unknown }) => {
          const msg = payload.new as unknown as ChatMessage
          setMessages(prev => {
            // Dedupe (we may have already added it optimistically)
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

    channelRef.current = channel

    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      supabase.removeChannel(channel)
      channelRef.current = null
      setIsConnected(false)
    }
  }, [sessionId, supabase, enabled, retryNonce, loadMessages])

  // Shared broadcast channel for typing indicators (admin <-> patient)
  useEffect(() => {
    if (!sessionId || !supabase || !enabled) return

    const channel = supabase
      .channel(`chat-typing:${sessionId}`)
      .on(
        'broadcast',
        { event: 'typing' },
        (message: { payload?: { sender?: string } }) => {
          if (message.payload?.sender !== 'admin') return
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
  }, [sessionId, supabase, enabled])

  /** Broadcast that the patient is typing (throttled). */
  const notifyTyping = useCallback(() => {
    const channel = typingChannelRef.current
    if (!channel) return
    const now = Date.now()
    if (now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: 'patient' },
    })
  }, [])

  /** Create a new session (called on first message) */
  const createSession = useCallback(
    async (visitorName?: string) => {
      if (!supabase) return null

      const { data: userData } = await supabase.auth.getUser()
      const patientId = userData?.user?.id || null
      if (!patientId) {
        setRequiresAuth(true)
        return null
      }
      setRequiresAuth(false)

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          patient_id: patientId,
          visitor_name: visitorName || null,
          status: 'active',
        })
        .select('id')
        .single()

      if (error || !data) {
        console.error('[LiveChat] Failed to create session:', error)
        return null
      }

      setSessionId(data.id)
      sessionStorage.setItem('ds_chat_session', data.id)
      try {
        trackEvent(ChatEvent.ChatSessionStarted, AnalyticsEventCategory.Chat)
      } catch {
        // analytics may fail silently
      }
      return data.id
    },
    [supabase]
  )

  /** Send a message */
  const sendMessage = useCallback(
    async (content: string, visitorName?: string) => {
      if (!supabase || !content.trim()) return

      let currentSessionId = sessionId

      // Create session on first message
      if (!currentSessionId) {
        currentSessionId = await createSession(visitorName)
        if (!currentSessionId) return
      }

      const optimisticMsg: ChatMessage = {
        id: `temp_${Date.now()}`,
        session_id: currentSessionId,
        sender: 'patient',
        content: content.trim(),
        created_at: new Date().toISOString(),
      }

      // Optimistic update
      setMessages(prev => [...prev, optimisticMsg])

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSessionId,
          sender: 'patient',
          content: content.trim(),
        })
        .select('*')
        .single()

      if (error) {
        console.error('[LiveChat] Failed to send message:', error)
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        return
      }

      // Replace optimistic message with real one
      if (data) {
        setMessages(prev =>
          prev.map(m => (m.id === optimisticMsg.id ? (data as ChatMessage) : m))
        )
        try {
          trackEvent(ChatEvent.ChatMessageSent, AnalyticsEventCategory.Chat)
        } catch {
          // analytics may fail silently
        }
      }
    },
    [supabase, sessionId, createSession]
  )

  /** Close the chat session */
  const closeSession = useCallback(async () => {
    if (!supabase || !sessionId) return

    await supabase
      .from('chat_sessions')
      .update({ status: 'closed' })
      .eq('id', sessionId)

    sessionStorage.removeItem('ds_chat_session')
    setSessionId(null)
    setMessages([])
  }, [supabase, sessionId])

  return {
    sessionId,
    messages,
    isConnected,
    isPeerTyping,
    notifyTyping,
    sendMessage,
    closeSession,
    requiresAuth,
    isReady: !!supabase,
  }
}
