import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'uk' },
  }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Accessibility: () => <span data-testid="icon-accessibility" />,
  Minus: () => <span data-testid="icon-minus" />,
  Plus: () => <span data-testid="icon-plus" />,
  RotateCcw: () => <span data-testid="icon-reset" />,
  X: () => <span data-testid="icon-x" />,
  ChevronDown: () => <span data-testid="icon-chevron" />,
}))

// Controllable mock state for useAccessibility
const mockA11y = {
  fontSize: 'normal' as 'normal' | 'larger' | 'largest',
  increaseFontSize: vi.fn(),
  decreaseFontSize: vi.fn(),
  resetFontSize: vi.fn(),
  highContrast: false,
  toggleHighContrast: vi.fn(),
  reducedMotion: false,
  toggleReducedMotion: vi.fn(),
  colorBlindnessMode: 'normal' as
    'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia',
  setColorBlindnessMode: vi.fn(),
}

vi.mock('@/hooks/useAccessibility', () => ({
  useAccessibility: () => mockA11y,
}))

import { AccessibilityPanel } from './AccessibilityPanel'

describe('AccessibilityPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    mockA11y.fontSize = 'normal'
    mockA11y.highContrast = false
    mockA11y.reducedMotion = false
    mockA11y.colorBlindnessMode = 'normal'
  })

  describe('toggle button', () => {
    it('renders toggle button by default', () => {
      render(<AccessibilityPanel />)
      const btn = screen.getByRole('button', { expanded: false })
      expect(btn).toBeInTheDocument()
    })

    it('hides toggle when hideToggle is true', () => {
      render(<AccessibilityPanel hideToggle />)
      expect(
        screen.queryByLabelText('accessibilityPanel.open')
      ).not.toBeInTheDocument()
    })

    it('opens panel on toggle click', () => {
      render(<AccessibilityPanel />)
      fireEvent.click(screen.getByRole('button', { expanded: false }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('panel opened via defaultOpen', () => {
    it('renders dialog immediately', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('renders panel title', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.getByText('accessibilityPanel.title')).toBeInTheDocument()
    })
  })

  describe('close mechanisms', () => {
    it('closes on X button click', () => {
      render(<AccessibilityPanel defaultOpen hideToggle />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      fireEvent.click(screen.getByLabelText('accessibilityPanel.close'))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('calls onClose callback when closing', () => {
      const onClose = vi.fn()
      render(<AccessibilityPanel defaultOpen hideToggle onClose={onClose} />)

      fireEvent.click(screen.getByLabelText('accessibilityPanel.close'))
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('closes on Escape key', () => {
      const onClose = vi.fn()
      render(<AccessibilityPanel defaultOpen onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  describe('font size controls', () => {
    it('renders increase and decrease buttons', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(
        screen.getByLabelText('accessibilityPanel.fontSize.decreaseAria')
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText('accessibilityPanel.fontSize.increaseAria')
      ).toBeInTheDocument()
    })

    it('calls increaseFontSize on + click', () => {
      render(<AccessibilityPanel defaultOpen />)
      fireEvent.click(
        screen.getByLabelText('accessibilityPanel.fontSize.increaseAria')
      )
      expect(mockA11y.increaseFontSize).toHaveBeenCalledOnce()
    })

    it('calls decreaseFontSize on - click', () => {
      mockA11y.fontSize = 'larger'
      render(<AccessibilityPanel defaultOpen />)
      fireEvent.click(
        screen.getByLabelText('accessibilityPanel.fontSize.decreaseAria')
      )
      expect(mockA11y.decreaseFontSize).toHaveBeenCalledOnce()
    })

    it('disables decrease button when fontSize is normal', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(
        screen.getByLabelText('accessibilityPanel.fontSize.decreaseAria')
      ).toBeDisabled()
    })

    it('disables increase button when fontSize is largest', () => {
      mockA11y.fontSize = 'largest'
      render(<AccessibilityPanel defaultOpen />)
      expect(
        screen.getByLabelText('accessibilityPanel.fontSize.increaseAria')
      ).toBeDisabled()
    })

    it('calls resetFontSize on reset click', () => {
      mockA11y.fontSize = 'larger'
      render(<AccessibilityPanel defaultOpen />)
      fireEvent.click(
        screen.getByLabelText('accessibilityPanel.fontSize.resetAria')
      )
      expect(mockA11y.resetFontSize).toHaveBeenCalledOnce()
    })
  })

  describe('high contrast toggle', () => {
    it('renders switch with aria-checked=false by default', () => {
      render(<AccessibilityPanel defaultOpen />)
      const toggle = screen.getByRole('switch', { name: /highContrast/i })
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('calls toggleHighContrast on click', () => {
      render(<AccessibilityPanel defaultOpen />)
      fireEvent.click(screen.getByRole('switch', { name: /highContrast/i }))
      expect(mockA11y.toggleHighContrast).toHaveBeenCalledOnce()
    })

    it('reflects highContrast=true state', () => {
      mockA11y.highContrast = true
      render(<AccessibilityPanel defaultOpen />)
      expect(
        screen.getByRole('switch', { name: /highContrast/i })
      ).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('reduced motion toggle', () => {
    it('renders switch with aria-checked=false by default', () => {
      render(<AccessibilityPanel defaultOpen />)
      const toggle = screen.getByRole('switch', { name: /reducedMotion/i })
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('calls toggleReducedMotion on click', () => {
      render(<AccessibilityPanel defaultOpen />)
      fireEvent.click(screen.getByRole('switch', { name: /reducedMotion/i }))
      expect(mockA11y.toggleReducedMotion).toHaveBeenCalledOnce()
    })
  })

  describe('color blindness select', () => {
    it('renders color perception section', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(
        screen.getByText('accessibilityPanel.colorPerception.title')
      ).toBeInTheDocument()
    })

    it('renders combobox for color blindness modes', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('reset all button', () => {
    it('does NOT show reset button when all settings are default', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.queryByText('Скинути все')).not.toBeInTheDocument()
    })

    it('shows reset button when fontSize is non-default', () => {
      mockA11y.fontSize = 'larger'
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.getByText('Скинути все')).toBeInTheDocument()
    })

    it('shows reset button when highContrast is on', () => {
      mockA11y.highContrast = true
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.getByText('Скинути все')).toBeInTheDocument()
    })

    it('shows reset button when reducedMotion is on', () => {
      mockA11y.reducedMotion = true
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.getByText('Скинути все')).toBeInTheDocument()
    })

    it('shows reset button when colorBlindnessMode is non-normal', () => {
      mockA11y.colorBlindnessMode = 'protanopia'
      render(<AccessibilityPanel defaultOpen />)
      expect(screen.getByText('Скинути все')).toBeInTheDocument()
    })

    it('calls all reset functions on click', () => {
      mockA11y.fontSize = 'largest'
      mockA11y.highContrast = true
      mockA11y.reducedMotion = true
      mockA11y.colorBlindnessMode = 'deuteranopia'
      render(<AccessibilityPanel defaultOpen />)

      fireEvent.click(screen.getByText('Скинути все'))

      expect(mockA11y.resetFontSize).toHaveBeenCalledOnce()
      expect(mockA11y.toggleHighContrast).toHaveBeenCalledOnce()
      expect(mockA11y.toggleReducedMotion).toHaveBeenCalledOnce()
      expect(mockA11y.setColorBlindnessMode).toHaveBeenCalledWith('normal')
    })

    it('does not toggle highContrast if already off', () => {
      mockA11y.fontSize = 'larger' // triggers hasCustomSettings
      mockA11y.highContrast = false
      render(<AccessibilityPanel defaultOpen />)

      fireEvent.click(screen.getByText('Скинути все'))

      expect(mockA11y.toggleHighContrast).not.toHaveBeenCalled()
    })
  })

  describe('ARIA attributes', () => {
    it('has region role with accessible label', () => {
      render(<AccessibilityPanel defaultOpen />)
      expect(
        screen.getByRole('region', {
          name: 'accessibilityPanel.regionLabel',
        })
      ).toBeInTheDocument()
    })

    it('dialog has aria-modal and aria-labelledby', () => {
      render(<AccessibilityPanel defaultOpen />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'a11y-panel-title')
    })
  })
})
