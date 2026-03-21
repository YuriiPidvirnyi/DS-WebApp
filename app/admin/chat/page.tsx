'use client'

import { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MessageSquare,
  Send,
  X,
  User,
  Clock,
  Wifi,
  WifiOff,
  ChevronLeft,
} from 'lucide-react'
import { useAdminChat, type ChatSession } from '@/hooks/useAdminChat'

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatDate(
  iso: string,
  locale: string,
  labels: { today: string; yesterday: string }
) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return labels.today
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return labels.yesterday
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

function SessionItem({
  session,
  isActive,
  onClick,
  locale,
  labels,
}: {
  session: ChatSession
  isActive: boolean
  onClick: () => void
  locale: string
  labels: {
    anonymous: string
    statusActive: string
    statusClosed: string
    today: string
    yesterday: string
  }
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-dental-primary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-dental-primary-600" />
          </div>
          <span className="font-medium text-dental-dark text-sm">
            {session.visitor_name || labels.anonymous}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {session.unread_count > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {session.unread_count}
            </span>
          )}
          <span className="text-xs text-dental-muted">
            {formatDate(session.updated_at, locale, labels)}
          </span>
        </div>
      </div>
      {session.last_message && (
        <p className="text-xs text-dental-muted truncate pl-10">
          {session.last_message}
        </p>
      )}
      <div className="flex items-center gap-1 mt-1 pl-10">
        <span
          className={`w-2 h-2 rounded-full ${
            session.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
          }`}
        />
        <span className="text-xs text-dental-muted">
          {session.status === 'active'
            ? labels.statusActive
            : labels.statusClosed}
        </span>
      </div>
    </button>
  )
}

export default function AdminChatPage() {
  const { t, i18n } = useTranslation()
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    isConnected,
    sendMessage,
    closeSession,
  } = useAdminChat()

  const filteredSessions =
    filter === 'active' ? sessions.filter(s => s.status === 'active') : sessions

  const activeSession = sessions.find(s => s.id === activeSessionId)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input
  useEffect(() => {
    if (activeSessionId) inputRef.current?.focus()
  }, [activeSessionId])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const totalUnread = sessions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.unread_count, 0)

  const locale =
    i18n.language === 'pl'
      ? 'pl-PL'
      : i18n.language === 'en'
        ? 'en-US'
        : 'uk-UA'

  const labels = {
    anonymous: t('admin.chat.anonymous'),
    statusActive: t('admin.chat.status.active'),
    statusClosed: t('admin.chat.status.closed'),
    today: t('admin.chat.date.today'),
    yesterday: t('admin.chat.date.yesterday'),
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-dental-secondary-200 overflow-hidden">
      {/* Sidebar — session list */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col ${
          activeSessionId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-dental-dark flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('admin.chat.title')}
              {totalUnread > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                  {totalUnread}
                </span>
              )}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-dental-muted hover:bg-gray-100'
              }`}
            >
              {t('admin.chat.filters.active')}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-dental-muted hover:bg-gray-100'
              }`}
            >
              {t('admin.chat.filters.all')}
            </button>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-dental-secondary-300 mx-auto mb-3" />
              <p className="text-sm text-dental-muted">
                {filter === 'active'
                  ? t('admin.chat.empty.active')
                  : t('admin.chat.empty.all')}
              </p>
            </div>
          ) : (
            filteredSessions.map(session => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onClick={() => setActiveSessionId(session.id)}
                locale={locale}
                labels={labels}
              />
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div
        className={`flex-1 flex flex-col ${
          !activeSessionId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {!activeSessionId ? (
          <div className="flex-1 flex items-center justify-center text-dental-muted">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-dental-secondary-200" />
              <p className="text-lg font-medium">
                {t('admin.chat.choose.title')}
              </p>
              <p className="text-sm mt-1">
                {t('admin.chat.choose.description')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSessionId(null)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
                  aria-label={t('admin.chat.aria.backToList')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-dental-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-dental-primary-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-dental-dark">
                    {activeSession?.visitor_name || labels.anonymous}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-dental-muted">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        {t('admin.chat.connection.realtime')}
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        {t('admin.chat.connection.disconnected')}
                      </>
                    )}
                    <span className="mx-1">•</span>
                    <Clock className="h-3 w-3" />
                    {activeSession &&
                      formatDate(activeSession.created_at, locale, labels)}
                  </div>
                </div>
              </div>
              {activeSession?.status === 'active' && (
                <button
                  onClick={() => closeSession(activeSessionId)}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t('admin.chat.actions.close')}
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === 'admin'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : msg.sender === 'system'
                          ? 'bg-gray-200 text-gray-600 text-center text-xs mx-auto'
                          : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender === 'admin'
                          ? 'text-white/60'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input (only for active sessions) */}
            {activeSession?.status === 'active' ? (
              <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('admin.chat.input.placeholder')}
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
                  aria-label={t('admin.chat.input.sendAria')}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 text-center text-sm text-dental-muted">
                {t('admin.chat.closed')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
