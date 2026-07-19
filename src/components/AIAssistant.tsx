'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useTranslation } from 'react-i18next'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { trackEvent, AIEvent, AnalyticsEventCategory } from '@/utils/analytics'
import { CONTACT_INFO } from '@/utils/constants'
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Stethoscope,
  Calendar,
  Clock,
  Phone,
} from 'lucide-react'

// Helper to extract text from message parts
function getMessageText(message: {
  parts?: Array<{ type: string; text?: string }>
}): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter(
      (p): p is { type: 'text'; text: string } => p.type === 'text' && !!p.text
    )
    .map(p => p.text)
    .join('')
}

// Quick action buttons
const quickActions = [
  { id: 'services', icon: Sparkles, labelKey: 'ai.quickActions.services' },
  { id: 'symptoms', icon: Stethoscope, labelKey: 'ai.quickActions.symptoms' },
  { id: 'booking', icon: Calendar, labelKey: 'ai.quickActions.booking' },
  { id: 'hours', icon: Clock, labelKey: 'ai.quickActions.hours' },
]

const quickActionPromptKeys: Record<string, string> = {
  services: 'ai.quickActionPrompts.services',
  symptoms: 'ai.quickActionPrompts.symptoms',
  booking: 'ai.quickActionPrompts.booking',
  hours: 'ai.quickActionPrompts.hours',
}

interface AIAssistantProps {
  onClose?: () => void
}

export default function AIAssistant({ onClose }: AIAssistantProps) {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(!!onClose) // Auto-open if controlled externally
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: { language: i18n.language },
      headers: (): Record<string, string> => {
        const csrfToken =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('csrf_token') || ''
            : ''
        return csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
      },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setMessages([])
    setInput('')
    onClose?.()
  }, [onClose, setMessages])

  // Focus trap: traps Tab, handles Escape, saves/restores previous focus
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, handleClose)

  // Focus the input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
    try {
      trackEvent(AIEvent.AIMessageSent, AnalyticsEventCategory.AI)
    } catch {
      // analytics may fail silently
    }
  }

  const handleQuickAction = (actionId: string) => {
    const promptKey = quickActionPromptKeys[actionId]
    const prompt = promptKey ? t(promptKey) : ''
    if (prompt) {
      sendMessage({ text: prompt })
    }
  }

  // Ч3: no click-outside dismissal — an accidental click outside must not close
  // and wipe the conversation. The chat closes only via its X button or Escape
  // (handled by useFocusTrap above).

  // When controlled externally (onClose provided), don't show trigger button
  const isControlled = !!onClose

  return (
    <div ref={containerRef} className="relative">
      {/* Floating button with enhanced styling - only show when not controlled externally */}
      {!isControlled && (
        <div
          className={`group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} transition-all duration-300`}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-14 h-14 bg-dental-primary-600 hover:bg-dental-primary-700 text-white rounded-full shadow-lg hover:shadow-xl hover:shadow-dental-primary-500/30 hover:scale-110 transition-all duration-300 flex items-center justify-center"
            aria-label={t('ai.openAssistant')}
          >
            {/* Subtle glow effect */}
            <span className="absolute inset-0 rounded-full bg-dental-primary-500 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
            <Bot
              className="w-6 h-6 relative z-10 group-hover:animate-bounce"
              style={{ animationDuration: '1s' }}
            />
          </button>

          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-dental-dark text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {t('ai.assistant')}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-dental-dark" />
          </div>
        </div>
      )}

      {/* Chat window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('ai.assistant')}
        className={`${isControlled ? '' : 'absolute bottom-16 right-0'} z-50 w-[380px] max-w-[calc(100vw-3rem)] transition-all duration-300 ${
          isOpen
            ? 'scale-100 opacity-100'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-dental-secondary-200 overflow-hidden flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-dental-primary-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{t('ai.assistant')}</h3>
                <p className="text-xs text-dental-primary-100">
                  {t('ai.online')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={t('ai.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-dental-secondary-50">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-dental-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-dental-primary-600" />
                </div>
                <h4 className="font-semibold text-dental-dark mb-2">
                  {t('ai.welcome')}
                </h4>
                <p className="text-sm text-dental-muted mb-6">
                  {t('ai.welcomeDescription')}
                </p>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-dental-secondary-200 rounded-lg text-sm text-dental-dark hover:border-dental-primary-300 hover:bg-dental-primary-50 transition-colors"
                    >
                      <action.icon className="w-4 h-4 text-dental-primary-600" />
                      <span>{t(action.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(message => {
                const text = getMessageText(message)
                if (!text) return null

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.role === 'user'
                          ? 'bg-dental-secondary-200'
                          : 'bg-dental-primary-100'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-dental-muted" />
                      ) : (
                        <Bot className="w-4 h-4 text-dental-primary-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-dental-primary-600 text-white rounded-tr-sm'
                          : 'bg-white border border-dental-secondary-200 text-dental-dark rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{text}</p>
                    </div>
                  </div>
                )
              })
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-dental-primary-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-dental-primary-600" />
                </div>
                <div className="bg-white border border-dental-secondary-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <Loader2 className="w-5 h-5 text-dental-primary-600 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-dental-secondary-200 bg-white"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={t('ai.inputPlaceholder')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-dental-secondary-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-dental-primary-500 focus:border-transparent text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-dental-primary-600 hover:bg-dental-primary-700 disabled:bg-dental-secondary-300 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Phone shortcut */}
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-dental-muted">
              <Phone className="w-3 h-3" />
              <span>
                {t('ai.callUs')}: {CONTACT_INFO.phone}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
