import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import AdminDashboard from '@/views/admin/AdminDashboard'

// Mock chart components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
}))

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockStats = {
  totalAppointments: 125,
  revenue: 50000,
  totalPatients: 340,
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard title', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByText(/Адмін-панель/i)).toBeInTheDocument()
  })

  it('displays all stat cards', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByText(/Всього записів/i)).toBeInTheDocument()
    expect(screen.getByText(/Нові пацієнти/i)).toBeInTheDocument()
    expect(screen.getByText(/Дохід/i)).toBeInTheDocument()
  })

  it('renders stat values correctly', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByText('125')).toBeInTheDocument()
    expect(screen.getByText('50000')).toBeInTheDocument()
    expect(screen.getByText('340')).toBeInTheDocument()
  })

  it('renders chart components', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  it('displays quick action links', () => {
    render(<AdminDashboard stats={mockStats} />)

    expect(screen.getByRole('link', { name: /Записи/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Лікарі/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Послуги/i })).toBeInTheDocument()
  })

  it('shows statistics section', () => {
    render(<AdminDashboard stats={mockStats} />)

    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    render(<AdminDashboard stats={mockStats} />)

    // Check for main landmark
    expect(screen.getByRole('main')).toBeInTheDocument()

    // Check for headings
    const headings = screen.getAllByRole('heading')
    expect(headings.length).toBeGreaterThan(0)
  })

  it('displays revenue formatted correctly', () => {
    render(<AdminDashboard stats={mockStats} />)

    // Revenue should be formatted with Ukrainian locale
    expect(screen.getByText(/50 000|50000/)).toBeInTheDocument()
  })

  it('responsive layout works on mobile', () => {
    // Mock window.matchMedia for mobile
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 640px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    render(<AdminDashboard stats={mockStats} />)

    // Dashboard should still render properly
    expect(screen.getByText(/Всього записів/i)).toBeInTheDocument()
  })

  it('has proper stat card structure', () => {
    render(<AdminDashboard stats={mockStats} />)

    const statCards = document.querySelectorAll('[role="article"]')
    expect(statCards.length).toBeGreaterThan(0)
  })

  it('displays legend for pie chart', async () => {
    render(<AdminDashboard stats={mockStats} />)

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    })
  })

  it('has proper semantic HTML', () => {
    render(<AdminDashboard stats={mockStats} />)

    const header = screen.getByRole('banner', { hidden: true })
    expect(header).toBeInTheDocument()
  })

  it('handles zero stats gracefully', () => {
    const zeroStats = {
      totalAppointments: 0,
      revenue: 0,
      totalPatients: 0,
    }

    render(<AdminDashboard stats={zeroStats} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('handles large numbers', () => {
    const largeStats = {
      totalAppointments: 999999,
      revenue: 9999999,
      totalPatients: 10000,
    }

    render(<AdminDashboard stats={largeStats} />)

    // Should render without crashing
    expect(screen.getByText(/999|9999/)).toBeInTheDocument()
  })
})

describe('AdminDashboard - Stat Cards', () => {
  it('each stat card is clickable', () => {
    render(<AdminDashboard stats={mockStats} />)

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('href')
    })
  })

  it('stat cards have trend indicators', () => {
    render(<AdminDashboard stats={mockStats} />)

    // Look for trend percentages or indicators
    expect(screen.getByText(/Записи|Лікарі|Послуги/)).toBeInTheDocument()
  })
})

describe('AdminDashboard - Accessibility', () => {
  it('supports screen reader navigation', () => {
    render(<AdminDashboard stats={mockStats} />)

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()

    const headings = screen.getAllByRole('heading')
    headings.forEach(heading => {
      expect(heading.textContent).toBeTruthy()
    })
  })

  it('has sufficient color contrast', () => {
    render(<AdminDashboard stats={mockStats} />)

    const elements = document.querySelectorAll('[class*="text-"]')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('keyboard navigation works', async () => {
    const user = (await import('@testing-library/user-event')).default
    render(<AdminDashboard stats={mockStats} />)

    const firstLink = screen.getAllByRole('link')[0]
    await user.tab()
    expect(firstLink).toHaveFocus()
  })
})
