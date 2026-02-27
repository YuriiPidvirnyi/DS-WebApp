import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Global module mocks (applied before every test file)
// ---------------------------------------------------------------------------

// next/navigation — replaces react-router-dom hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    getAll: vi.fn().mockReturnValue([]),
    has: vi.fn().mockReturnValue(false),
    toString: vi.fn().mockReturnValue(''),
    entries: vi.fn().mockReturnValue([]),
  }),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}))

// next/image — render as a plain <img> in jsdom
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
    style,
    _priority,
    ...rest
  }: Record<string, unknown>) => {
    const React = require('react') // eslint-disable-line @typescript-eslint/no-require-imports
    return React.createElement('img', {
      src,
      alt,
      width,
      height,
      className,
      style,
      ...rest,
    })
  },
}))

// next/link — render as a plain <a> in jsdom (Next.js 13+ does this natively, but ensure it)
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: Record<string, unknown>) => {
    const React = require('react') // eslint-disable-line @typescript-eslint/no-require-imports
    return React.createElement('a', { href, className, ...rest }, children)
  },
}))

// Clean up after each test case
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock IntersectionObserver
  ;(globalThis as any).IntersectionObserver = vi
    .fn()
    .mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))

  // Mock ResizeObserver
  ;(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  ;(globalThis as any).localStorage = localStorageMock

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  ;(globalThis as any).sessionStorage = sessionStorageMock
})
