import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@/test/test-utils'
import LazyImage from '../LazyImage'
import { mockIntersectionObserver } from '@/test/test-utils'

// Mock Image constructor to control loading behavior
const mockImage = vi.fn()
;(globalThis as any).Image = mockImage

describe('LazyImage', () => {
  let mockObserve: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    const mocks = mockIntersectionObserver()
    mockObserve = mocks.mockObserve
  })

  it('renders placeholder initially', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        placeholder="/placeholder.svg"
      />
    )

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/placeholder.svg')
    expect(img).toHaveAttribute('alt', 'Test image')
  })

  it('shows loading overlay initially', () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />)

    expect(screen.getByRole('img')).toHaveClass('opacity-70')
    // Check for loading dots animation instead of text
    const loadingDots = screen
      .getByRole('img')
      .parentElement?.querySelector('.animate-pulse')
    expect(loadingDots).toBeInTheDocument()
  })

  it('loads image eagerly when loading prop is eager', () => {
    const mockImageInstance = {
      onload: vi.fn(),
      onerror: vi.fn(),
      src: '',
    }
    mockImage.mockReturnValue(mockImageInstance)

    render(<LazyImage src="/test-image.jpg" alt="Test image" loading="eager" />)

    expect(mockImage).toHaveBeenCalled()
  })

  it('uses intersection observer for lazy loading', () => {
    render(<LazyImage src="/test-image.jpg" alt="Test image" />)

    expect(mockObserve).toHaveBeenCalled()
  })

  it('handles successful image loading', async () => {
    const mockImageInstance = {
      onload: vi.fn(),
      onerror: vi.fn(),
      src: '',
    }
    mockImage.mockReturnValue(mockImageInstance)

    render(<LazyImage src="/test-image.jpg" alt="Test image" loading="eager" />)

    // Simulate successful image load
    await act(async () => {
      mockImageInstance.onload()
    })

    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', '/test-image.jpg')
      expect(img).toHaveClass('opacity-100')
    })
  })

  it('handles image loading error with fallback', async () => {
    const mockImageInstance = {
      onload: vi.fn(),
      onerror: vi.fn(),
      src: '',
    }
    const mockFallbackInstance = {
      onload: vi.fn(),
      onerror: vi.fn(),
      src: '',
    }

    mockImage
      .mockReturnValueOnce(mockImageInstance)
      .mockReturnValueOnce(mockFallbackInstance)

    render(
      <LazyImage
        src="/test-image.jpg"
        fallback="/fallback-image.jpg"
        alt="Test image"
        loading="eager"
      />
    )

    // Simulate main image load error and fallback success
    await act(async () => {
      mockImageInstance.onerror()
      mockFallbackInstance.onload()
    })

    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', '/fallback-image.jpg')
    })
  })

  it('handles error without fallback', async () => {
    const mockImageInstance = {
      onload: vi.fn(),
      onerror: vi.fn(),
      src: '',
    }
    mockImage.mockReturnValue(mockImageInstance)

    render(<LazyImage src="/test-image.jpg" alt="Test image" loading="eager" />)

    // Simulate image load error
    await act(async () => {
      mockImageInstance.onerror()
    })

    await waitFor(() => {
      expect(screen.getByText('Зображення недоступне')).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
      />
    )

    const container = screen.getByRole('img').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('sets proper aspect ratio when width and height provided', () => {
    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        width={800}
        height={600}
      />
    )

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('width', '800')
    expect(img).toHaveAttribute('height', '600')
  })

  it('calls onLoad callback when image loads', async () => {
    const onLoad = vi.fn()
    const mockImageInstance = {
      onload: vi.fn(),
      onerror: vi.fn(),
      src: '',
    }
    mockImage.mockReturnValue(mockImageInstance)

    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        onLoad={onLoad}
        loading="eager"
      />
    )

    // Simulate successful image load
    await act(async () => {
      mockImageInstance.onload()
    })

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled()
    })
  })

  it('calls onError callback when image fails to load', async () => {
    const onError = vi.fn()
    const mockImageInstance = {
      onload: vi.fn(),
      onerror: vi.fn(),
      src: '',
    }
    mockImage.mockReturnValue(mockImageInstance)

    render(
      <LazyImage
        src="/test-image.jpg"
        alt="Test image"
        onError={onError}
        loading="eager"
      />
    )

    // Simulate image load error
    await act(async () => {
      mockImageInstance.onerror()
    })

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })
})
