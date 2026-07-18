import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'uk' },
  }),
}))

// Mock @ai-sdk/react
const mockSendMessage = vi.fn()
const mockSetMessages = vi.fn()
let mockMessages: Array<{
  id: string
  role: string
  parts: Array<{ type: string; text: string }>
}> = []
let mockStatus = 'ready'

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: mockMessages,
    sendMessage: mockSendMessage,
    status: mockStatus,
    setMessages: mockSetMessages,
  }),
}))

vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
}))

// Mock useFocusTrap
const mockContainerRef = { current: null }
vi.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: () => mockContainerRef,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x" />,
  Send: () => <span data-testid="icon-send" />,
  Bot: () => <span data-testid="icon-bot" />,
  User: () => <span data-testid="icon-user" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
  Stethoscope: () => <span data-testid="icon-stethoscope" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  Phone: () => <span data-testid="icon-phone" />,
}))

import AIAssistant from './AIAssistant'
import { CONTACT_INFO } from '@/utils/constants'

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMessages = []
    mockStatus = 'ready'
  })

  describe('standalone mode (no onClose)', () => {
    it('renders floating trigger button when closed', () => {
      render(<AIAssistant />)
      expect(screen.getByLabelText('ai.openAssistant')).toBeInTheDocument()
    })

    it('opens chat window on trigger click', () => {
      render(<AIAssistant />)
      fireEvent.click(screen.getByLabelText('ai.openAssistant'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('shows welcome message and quick actions when no messages', () => {
      render(<AIAssistant />)
      fireEvent.click(screen.getByLabelText('ai.openAssistant'))
      expect(screen.getByText('ai.welcome')).toBeInTheDocument()
      expect(screen.getByText('ai.welcomeDescription')).toBeInTheDocument()
    })

    it('renders all 4 quick action buttons', () => {
      render(<AIAssistant />)
      fireEvent.click(screen.getByLabelText('ai.openAssistant'))
      expect(screen.getByText('ai.quickActions.services')).toBeInTheDocument()
      expect(screen.getByText('ai.quickActions.symptoms')).toBeInTheDocument()
      expect(screen.getByText('ai.quickActions.booking')).toBeInTheDocument()
      expect(screen.getByText('ai.quickActions.hours')).toBeInTheDocument()
    })
  })

  describe('controlled mode (with onClose) — regression test for !!onClose bug', () => {
    it('auto-opens when onClose is provided', () => {
      const onClose = vi.fn()
      render(<AIAssistant onClose={onClose} />)
      // Dialog should be visible immediately — this is the !!onClose fix
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does NOT render floating trigger button when controlled', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      expect(
        screen.queryByLabelText('ai.openAssistant')
      ).not.toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn()
      render(<AIAssistant onClose={onClose} />)
      fireEvent.click(screen.getByLabelText('ai.close'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('clears messages and input on close', () => {
      const onClose = vi.fn()
      render(<AIAssistant onClose={onClose} />)
      fireEvent.click(screen.getByLabelText('ai.close'))
      expect(mockSetMessages).toHaveBeenCalledWith([])
    })
  })

  describe('message input', () => {
    it('renders text input for messages', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      expect(
        screen.getByPlaceholderText('ai.inputPlaceholder')
      ).toBeInTheDocument()
    })

    it('submit button is disabled when input is empty', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      // The submit button has no text, just a Send icon
      const buttons = screen.getAllByRole('button')
      const sendButton = buttons.find(
        btn => btn.getAttribute('type') === 'submit'
      )
      expect(sendButton).toBeDisabled()
    })

    it('sends message on form submit', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      const input = screen.getByPlaceholderText('ai.inputPlaceholder')
      fireEvent.change(input, { target: { value: 'Hello' } })

      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(mockSendMessage).toHaveBeenCalledWith({ text: 'Hello' })
    })

    it('clears input after sending', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      const input = screen.getByPlaceholderText(
        'ai.inputPlaceholder'
      ) as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Hello' } })

      const form = input.closest('form')!
      fireEvent.submit(form)

      expect(input.value).toBe('')
    })

    it('does not send empty messages', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      const input = screen.getByPlaceholderText('ai.inputPlaceholder')
      const form = input.closest('form')!
      fireEvent.submit(form)
      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('does not send whitespace-only messages', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      const input = screen.getByPlaceholderText('ai.inputPlaceholder')
      fireEvent.change(input, { target: { value: '   ' } })
      const form = input.closest('form')!
      fireEvent.submit(form)
      expect(mockSendMessage).not.toHaveBeenCalled()
    })
  })

  describe('quick actions', () => {
    it('sends translated prompt on quick action click', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      fireEvent.click(screen.getByText('ai.quickActions.services'))
      expect(mockSendMessage).toHaveBeenCalledWith({
        text: 'ai.quickActionPrompts.services',
      })
    })
  })

  describe('message rendering', () => {
    it('renders user and assistant messages', () => {
      mockMessages = [
        {
          id: '1',
          role: 'user',
          parts: [{ type: 'text', text: 'What services?' }],
        },
        {
          id: '2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'We offer dental services.' }],
        },
      ]
      render(<AIAssistant onClose={vi.fn()} />)
      expect(screen.getByText('What services?')).toBeInTheDocument()
      expect(screen.getByText('We offer dental services.')).toBeInTheDocument()
    })

    it('skips messages with no text parts', () => {
      mockMessages = [
        { id: '1', role: 'assistant', parts: [] },
        {
          id: '2',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
      ]
      render(<AIAssistant onClose={vi.fn()} />)
      expect(screen.getByText('Hello')).toBeInTheDocument()
      // Welcome screen should NOT be shown since messages array is non-empty
      expect(screen.queryByText('ai.welcome')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows loader when status is streaming', () => {
      mockStatus = 'streaming'
      render(<AIAssistant onClose={vi.fn()} />)
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
    })

    it('shows loader when status is submitted', () => {
      mockStatus = 'submitted'
      render(<AIAssistant onClose={vi.fn()} />)
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument()
    })

    it('disables input when loading', () => {
      mockStatus = 'streaming'
      render(<AIAssistant onClose={vi.fn()} />)
      expect(screen.getByPlaceholderText('ai.inputPlaceholder')).toBeDisabled()
    })
  })

  describe('phone shortcut', () => {
    it('displays clinic phone number', () => {
      render(<AIAssistant onClose={vi.fn()} />)
      expect(
        screen.getByText(new RegExp(CONTACT_INFO.phone.replace('+', '\\+')))
      ).toBeInTheDocument()
    })
  })
})
