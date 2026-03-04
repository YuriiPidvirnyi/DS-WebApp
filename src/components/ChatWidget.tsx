'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Phone, Clock, Sparkles } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'bot'
  text: string
  timestamp: Date
}

// Quick reply options
const quickReplies = [
  { text: 'Записатися на прийом', action: 'booking' },
  { text: 'Ціни на послуги', action: 'prices' },
  { text: 'Години роботи', action: 'hours' },
  { text: 'Контакти', action: 'contact' },
]

// Bot responses based on actions
const botResponses: Record<string, string> = {
  booking: 'Щоб записатися на прийом, перейдіть на сторінку бронювання або зателефонуйте нам за номером +380 44 123 45 67. Ми працюємо щодня з 9:00 до 20:00.',
  prices: 'Ознайомитися з цінами на послуги можна на сторінці "Послуги". Безкоштовна консультація для нових пацієнтів!',
  hours: 'Ми працюємо:\n• Пн-Пт: 9:00 - 20:00\n• Сб: 10:00 - 18:00\n• Нд: вихідний',
  contact: 'Наші контакти:\n• Телефон: +380 44 123 45 67\n• Email: info@dentalstory.ua\n• Адреса: вул. Хрещатик 1, Київ',
  default: 'Дякуємо за ваше повідомлення! Наш менеджер зв\'яжеться з вами найближчим часом. Для швидкого зв\'язку телефонуйте: +380 44 123 45 67',
}

// Format time safely for SSR (avoid hydration mismatch)
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize messages only on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setMessages([
      {
        id: '1',
        type: 'bot',
        text: 'Вітаємо в Dental Story! Чим можемо допомогти?',
        timestamp: new Date(),
      },
    ])
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const addMessage = (text: string, type: 'user' | 'bot') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleQuickReply = (action: string) => {
    const quickReply = quickReplies.find((r) => r.action === action)
    if (quickReply) {
      addMessage(quickReply.text, 'user')
      simulateBotResponse(action)
    }
  }

  const simulateBotResponse = (action: string) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      addMessage(botResponses[action] || botResponses.default, 'bot')
    }, 1000 + Math.random() * 500)
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    
    addMessage(inputValue, 'user')
    setInputValue('')
    simulateBotResponse('default')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center text-white"
        aria-label="Відкрити чат"
      >
        <MessageCircle className="h-7 w-7" />
      </button>
    )
  }

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center text-white hover:from-teal-600 hover:to-teal-700 transition-all duration-300 hover:scale-105 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-label="Відкрити чат"
      >
        <MessageCircle className="h-7 w-7" />
        {/* Notification dot */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Dental Story</h3>
                <p className="text-sm text-white/80">Онлайн-консультант</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Закрити чат"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>9:00 - 20:00</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>+380 44 123 45 67</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-teal-500 text-white rounded-br-md'
                    : 'bg-white text-slate-700 shadow-sm rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-white/60' : 'text-slate-400'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-700 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {messages.length < 3 && (
          <div className="p-3 bg-white border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">Швидкі відповіді:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply.action}
                  onClick={() => handleQuickReply(reply.action)}
                  className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full transition-colors"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишіть повідомлення..."
              className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-10 h-10 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label="Надіслати"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
