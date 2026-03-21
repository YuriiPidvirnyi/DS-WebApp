'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { MessageSquare, X, Send, Wifi, WifiOff } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useLiveChat } from '@/hooks/useLiveChat'

interface LiveChatProps {
  onClose?: () => void
}

function formatTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export default function LiveChat({ onClose }: LiveChatProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(!!onClose)
  const [input, setInput] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [nameSubmitted, setNameSubmitted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  const containerRef = useFocusTrap<HTMLDivElement>(isOpen, handleClose)

  const { messages, isConnected, sendMessage, requiresAuth, isReady } =
    useLiveChat({
      enabled: isOpen && nameSubmitted,
    })

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, nameSubmitted])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, handleClose, containerRef])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input, visitorName)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitorName.trim()) return
    setNameSubmitted(true)
  }

  const isControlled = !!onClose

  if (!isReady) {
    return null
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button — only when standalone */}
      {!isControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
          aria-label={t('chat.openChat')}
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('chat.dialogAriaLabel')}
        className={`${isControlled ? '' : 'absolute bottom-16 right-0'} z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-dental-secondary-200 overflow-hidden transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">{t('common.brandName')}</h3>
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    {t('chat.connected')}
                  </>
                ) : nameSubmitted ? (
                  <>
                    <WifiOff className="h-3 w-3" />
                    {t('chat.connecting')}
                  </>
                ) : (
                  t('chat.subtitle')
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            aria-label={t('chat.closeChat')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Name input (before chat starts) */}
        {!nameSubmitted ? (
          <form onSubmit={handleNameSubmit} className="p-6 space-y-4">
            <p className="text-sm text-dental-text">{t('chat.namePrompt')}</p>
            <input
              ref={inputRef}
              type="text"
              value={visitorName}
              onChange={e => setVisitorName(e.target.value)}
              placeholder={t('chat.namePlaceholder')}
              className="w-full bg-dental-secondary-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
            >
              {t('chat.startChat')}
            </button>
          </form>
        ) : requiresAuth ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-dental-text">{t('chat.authRequired')}</p>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {t('chat.login')}
              </Link>
              <button
                onClick={() => setNameSubmitted(false)}
                className="px-4 py-3 rounded-xl border border-dental-secondary-200 text-dental-text hover:bg-dental-secondary-50 transition-colors"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {/* System welcome */}
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-dental-secondary-300 mx-auto mb-3" />
                  <p className="text-sm text-dental-muted">
                    {t('chat.welcomeMessage')}
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === 'patient'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : msg.sender === 'system'
                          ? 'bg-gray-200 text-gray-600 text-center text-xs mx-auto'
                          : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-md'
                    }`}
                  >
                    {msg.sender === 'admin' && (
                      <p className="text-xs font-medium text-blue-600 mb-1">
                        {t('common.brandName')}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === 'patient'
                          ? 'text-white/60'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatTime(new Date(msg.created_at))}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.inputPlaceholder')}
                className="flex-1 bg-dental-secondary-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-dental-secondary-300 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label={t('chat.sendMessage')}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
