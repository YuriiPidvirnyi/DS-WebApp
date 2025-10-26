import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'

// Mock providers for testing
const TestProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestProviders, ...options })

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createTestUser = () => ({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+380501234567',
})

export const createTestAppointment = () => ({
  id: '123',
  service: 'Консультація стоматолога',
  date: '2024-01-15',
  time: '10:00',
  name: 'John Doe',
  phone: '+380501234567',
  email: 'john.doe@example.com',
  created: new Date().toISOString(),
})

// Mock API responses
export const mockApiResponse = {
  success: (data: any = {}) => ({
    success: true,
    data,
    message: 'Success',
  }),
  error: (message: string = 'Error occurred') => ({
    success: false,
    error: message,
    data: null,
  }),
}

// Common test assertions
export const expectToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveAccessibleName = (element: HTMLElement, name: string) => {
  expect(element).toHaveAccessibleName(name)
}

export const expectToHaveRole = (element: HTMLElement, role: string) => {
  expect(element).toHaveRole(role)
}

// Mock intersection observer for lazy loading tests
export const mockIntersectionObserver = () => {
  const mockObserve = vi.fn()
  const mockUnobserve = vi.fn()
  const mockDisconnect = vi.fn()

  ;(globalThis as any).IntersectionObserver = vi.fn().mockImplementation((callback: any) => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    callback,
  }))

  return { mockObserve, mockUnobserve, mockDisconnect }
}