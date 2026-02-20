'use client'

import React, { createContext, useState, useEffect, ReactNode } from 'react'

// Interface for accessibility context
interface AccessibilityContextType {
  // Font size control
  fontSize: 'normal' | 'larger' | 'largest'
  increaseFontSize: () => void
  decreaseFontSize: () => void
  resetFontSize: () => void

  // High contrast mode
  highContrast: boolean
  toggleHighContrast: () => void

  // Reduced motion mode
  reducedMotion: boolean
  toggleReducedMotion: () => void

  // Color blindness simulation
  colorBlindnessMode: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  setColorBlindnessMode: (
    mode: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  ) => void
}

// Creating context with default values
export const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
}) => {
  // Font size state
  const [fontSize, setFontSize] = useState<'normal' | 'larger' | 'largest'>(
    'normal'
  )

  // High contrast state
  const [highContrast, setHighContrast] = useState(false)

  // Reduced motion state
  const [reducedMotion, setReducedMotion] = useState(false)

  // Color blindness simulation state
  const [colorBlindnessMode, setColorBlindnessMode] = useState<
    'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  >('normal')

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedFontSize = localStorage.getItem('a11y-fontSize')
    const savedHighContrast =
      localStorage.getItem('a11y-highContrast') === 'true'
    const savedReducedMotion =
      localStorage.getItem('a11y-reducedMotion') === 'true'
    const savedColorBlindnessMode = localStorage.getItem(
      'a11y-colorBlindnessMode'
    ) as 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'

    if (savedFontSize) {
      setFontSize(savedFontSize as 'normal' | 'larger' | 'largest')
    }

    setHighContrast(savedHighContrast)
    setReducedMotion(savedReducedMotion)

    if (savedColorBlindnessMode) {
      setColorBlindnessMode(savedColorBlindnessMode)
    }

    // Also check prefers-reduced-motion media query
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion && !savedReducedMotion) {
      setReducedMotion(true)
    }
  }, [])

  // Apply font size class to body
  useEffect(() => {
    const body = document.body

    // Remove existing font size classes
    body.classList.remove(
      'font-size-normal',
      'font-size-larger',
      'font-size-largest'
    )

    // Add current font size class
    body.classList.add(`font-size-${fontSize}`)

    // Save to localStorage
    localStorage.setItem('a11y-fontSize', fontSize)
  }, [fontSize])

  // Apply high contrast class to body
  useEffect(() => {
    const body = document.body

    if (highContrast) {
      body.classList.add('high-contrast')
    } else {
      body.classList.remove('high-contrast')
    }

    // Save to localStorage
    localStorage.setItem('a11y-highContrast', String(highContrast))
  }, [highContrast])

  // Apply reduced motion class to body
  useEffect(() => {
    const body = document.body

    if (reducedMotion) {
      body.classList.add('reduced-motion')
    } else {
      body.classList.remove('reduced-motion')
    }

    // Save to localStorage
    localStorage.setItem('a11y-reducedMotion', String(reducedMotion))
  }, [reducedMotion])

  // Apply color blindness simulation class to body
  useEffect(() => {
    const body = document.body

    // Remove existing color blindness simulation classes
    body.classList.remove(
      'normal-vision',
      'protanopia',
      'deuteranopia',
      'tritanopia'
    )

    // Add current color blindness simulation class
    body.classList.add(
      colorBlindnessMode === 'normal' ? 'normal-vision' : colorBlindnessMode
    )

    // Save to localStorage
    localStorage.setItem('a11y-colorBlindnessMode', colorBlindnessMode)
  }, [colorBlindnessMode])

  // Font size control functions
  const increaseFontSize = () => {
    setFontSize(prev => {
      if (prev === 'normal') return 'larger'
      if (prev === 'larger') return 'largest'
      return prev
    })
  }

  const decreaseFontSize = () => {
    setFontSize(prev => {
      if (prev === 'largest') return 'larger'
      if (prev === 'larger') return 'normal'
      return prev
    })
  }

  const resetFontSize = () => {
    setFontSize('normal')
  }

  // Toggle high contrast
  const toggleHighContrast = () => {
    setHighContrast(prev => !prev)
  }

  // Toggle reduced motion
  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev)
  }

  // Context value
  const value = {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    colorBlindnessMode,
    setColorBlindnessMode,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}
