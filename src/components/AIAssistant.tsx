'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useTranslation } from 'react-i18next'
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Sparkles,
  Stethoscope,
  Calendar,
  Clock,
  Phone
} from 'lucide-react'

// Helper to extract text from message parts
function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && !!p.text)
    .map((p) => p.text)
    .join('')
}

// Quick action buttons
const quickActions = [
  { id: 'services', icon: Sparkles, labelKey: 'ai.quickActions.services' },
  { id: 'symptoms', icon: Stethoscope, labelKey: 'ai.quickActions.symptoms' },
  { id: 'booking', icon: Calendar, labelKey: 'ai.quickActions.booking' },
  { id: 'hours', icon: Clock, labelKey: 'ai.quickActions.hours' },
]

const quickActionPrompts: Record<string, Record<string, string>> = {
  services: {
    uk: 'Які послуги ви надаєте та скільки вони коштують?',
    en: 'What services do you offer and what are the prices?',
    pl: 'Jakie usługi oferujecie i jakie są ceny?',
  },
  symptoms: {
    uk: 'У мене болить зуб. Що це може бути?',
    en: 'I have a toothache. What could it be?',
    pl: 'Boli mnie ząb. Co to może być?',
  },
  booking: {
    uk: 'Як записатися на прийом?',
    en: 'How can I book an appointment?',
    pl: 'Jak mogę umówić się na wizytę?',
  },
  hours: {
    uk: 'Коли працює клініка?',
    en: 'What are your working hours?',
    pl: 'Jakie są godziny pracy kliniki?',
  },
}

export default function AIAssistant() {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/ai/chat',
      body: { language: i18n.language },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleQuickAction = (actionId: string) => {
    const lang = i18n.language as 'uk' | 'en' | 'pl'
    const prompt = quickActionPrompts[actionId]?.[lang] || quickActionPrompts[actionId]?.uk
    if (prompt) {
      sendMessage({ text: prompt })
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setMessages([])
    setInput('')
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 z-40 w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label={t('ai.openAssistant')}
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-pulse" />
        
        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t('ai.assistant')}
        </span>
      </button>

      {/* Chat window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{t('ai.assistant')}</h3>
                <p className="text-xs text-teal-100">{t('ai.online')}</p>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-teal-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">{t('ai.welcome')}</h4>
                <p className="text-sm text-slate-600 mb-6">{t('ai.welcomeDescription')}</p>
                
                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                    >
                      <action.icon className="w-4 h-4 text-teal-600" />
                      <span>{t(action.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const text = getMessageText(message)
                if (!text) return null
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' ? 'bg-slate-200' : 'bg-teal-100'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-slate-600" />
                      ) : (
                        <Bot className="w-4 h-4 text-teal-600" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-teal-600 text-white rounded-tr-sm'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
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
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-teal-600" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('ai.inputPlaceholder')}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Phone shortcut */}
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Phone className="w-3 h-3" />
              <span>{t('ai.callUs')}: +380 67 123 45 67</span>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
