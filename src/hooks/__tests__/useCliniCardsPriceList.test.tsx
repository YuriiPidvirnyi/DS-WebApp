import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCliniCardsPriceList } from '../useCliniCardsPriceList'
import * as clinicardsApi from '../../services/clinicardsApi'

// Mock the API
vi.mock('../../services/clinicardsApi')
vi.mock('../../services/monitoring', () => ({
  monitoring: {
    trackMetric: vi.fn(),
    trackError: vi.fn(),
  },
}))

describe('useCliniCardsPriceList', () => {
  const mockPriceList = [
    {
      id: 'price_1',
      categoryId: 'cat_1',
      categoryName: 'Терапія',
      name: 'Лікування карієсу',
      price: 1200,
      duration: 60,
      description: 'Лікування з пломбою',
    },
    {
      id: 'price_2',
      categoryId: 'cat_1',
      categoryName: 'Терапія',
      name: 'Чистка зубів',
      price: 800,
      duration: 30,
    },
    {
      id: 'price_3',
      categoryId: 'cat_2',
      categoryName: 'Хірургія',
      name: 'Видалення зуба',
      price: 1500,
      duration: 45,
    },
  ]

  const mockApi = {
    getPriceList: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.spyOn(clinicardsApi, 'getCliniCardsApi').mockReturnValue(
      mockApi as never
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial loading', () => {
    it('should load price list on mount', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toHaveLength(2)
      expect(result.current.categories[0].name).toBe('Терапія')
      expect(result.current.categories[0].items).toHaveLength(2)
    })

    it('should handle API errors', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: false,
        error: 'API Error',
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.error).toBe('API Error')
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.categories).toHaveLength(0)
    })

    it('should load from cache if available', async () => {
      const cached = {
        data: [
          {
            id: 'cat_1',
            name: 'Cached Category',
            items: [mockPriceList[0]],
          },
        ],
        timestamp: Date.now(),
      }
      localStorage.setItem('clinicards_price_list', JSON.stringify(cached))

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.categories).toHaveLength(1)
      expect(result.current.categories[0].name).toBe('Cached Category')
      expect(mockApi.getPriceList).not.toHaveBeenCalled()
    })

    it('should not use expired cache', async () => {
      const expired = {
        data: [{ id: 'cat_1', name: 'Old', items: [] }],
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      }
      localStorage.setItem('clinicards_price_list', JSON.stringify(expired))

      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockApi.getPriceList).toHaveBeenCalled()
      expect(result.current.categories[0].name).not.toBe('Old')
    })
  })

  describe('Grouping and sorting', () => {
    it('should group items by category', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2)
      })

      const therapyCategory = result.current.categories.find(
        c => c.name === 'Терапія'
      )
      const surgeryCategory = result.current.categories.find(
        c => c.name === 'Хірургія'
      )

      expect(therapyCategory?.items).toHaveLength(2)
      expect(surgeryCategory?.items).toHaveLength(1)
    })

    it('should sort categories alphabetically', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2)
      })

      expect(result.current.categories[0].name).toBe('Терапія')
      expect(result.current.categories[1].name).toBe('Хірургія')
    })

    it('should sort items within categories', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.categories).toHaveLength(2)
      })

      const therapyItems = result.current.categories[0].items
      expect(therapyItems[0].name).toBe('Лікування карієсу')
      expect(therapyItems[1].name).toBe('Чистка зубів')
    })
  })

  describe('Search functionality', () => {
    beforeEach(async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })
    })

    it('should search by item name', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const results = result.current.search('карієсу')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Лікування карієсу')
    })

    it('should search by description', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const results = result.current.search('пломбою')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Лікування карієсу')
    })

    it('should search by category name', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const results = result.current.search('Хірургія')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Видалення зуба')
    })

    it('should return empty array for no matches', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const results = result.current.search('nonexistent')
      expect(results).toHaveLength(0)
    })

    it('should be case-insensitive', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const results = result.current.search('КАРІЄСУ')
      expect(results).toHaveLength(1)
    })
  })

  describe('Category filtering', () => {
    beforeEach(async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })
    })

    it('should get items by category ID', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const items = result.current.getItemsByCategory('cat_1')
      expect(items).toHaveLength(2)
    })

    it('should return empty array for non-existent category', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const items = result.current.getItemsByCategory('nonexistent')
      expect(items).toHaveLength(0)
    })
  })

  describe('Get item by ID', () => {
    beforeEach(async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })
    })

    it('should find item by ID', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const item = result.current.getItemById('price_1')
      expect(item).not.toBeNull()
      expect(item?.name).toBe('Лікування карієсу')
    })

    it('should return null for non-existent item', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const item = result.current.getItemById('nonexistent')
      expect(item).toBeNull()
    })
  })

  describe('Statistics', () => {
    beforeEach(async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })
    })

    it('should calculate correct statistics', async () => {
      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const stats = result.current.getStatistics()

      expect(stats.totalItems).toBe(3)
      expect(stats.totalCategories).toBe(2)
      expect(stats.minPrice).toBe(800)
      expect(stats.maxPrice).toBe(1500)
      expect(stats.avgPrice).toBe((1200 + 800 + 1500) / 3)
    })

    it('should return zero stats for empty list', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: [],
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const stats = result.current.getStatistics()

      expect(stats.totalItems).toBe(0)
      expect(stats.totalCategories).toBe(0)
      expect(stats.minPrice).toBe(0)
      expect(stats.maxPrice).toBe(0)
      expect(stats.avgPrice).toBe(0)
    })
  })

  describe('Refresh functionality', () => {
    it('should force refresh from API', async () => {
      mockApi.getPriceList.mockResolvedValue({
        success: true,
        data: mockPriceList,
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockApi.getPriceList).toHaveBeenCalledTimes(1)

      await result.current.refresh()

      expect(mockApi.getPriceList).toHaveBeenCalledTimes(2)
    })
  })

  describe('Auto-refresh', () => {
    it('should auto-refresh after interval', async () => {
      vi.useFakeTimers()

      mockApi.getPriceList.mockResolvedValue({
        success: true,
        data: mockPriceList,
      })

      renderHook(() =>
        useCliniCardsPriceList({
          autoRefresh: true,
          refreshInterval: 1000,
        })
      )

      await waitFor(() => {
        expect(mockApi.getPriceList).toHaveBeenCalledTimes(1)
      })

      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockApi.getPriceList).toHaveBeenCalledTimes(2)
      })

      vi.useRealTimers()
    })

    it('should not auto-refresh when disabled', async () => {
      vi.useFakeTimers()

      mockApi.getPriceList.mockResolvedValue({
        success: true,
        data: mockPriceList,
      })

      renderHook(() =>
        useCliniCardsPriceList({
          autoRefresh: false,
        })
      )

      await waitFor(() => {
        expect(mockApi.getPriceList).toHaveBeenCalledTimes(1)
      })

      vi.advanceTimersByTime(10000)

      expect(mockApi.getPriceList).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('Cache management', () => {
    it('should save to localStorage on successful load', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        const cached = localStorage.getItem('clinicards_price_list')
        expect(cached).not.toBeNull()
      })
    })

    it('should use custom cache key', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      renderHook(() =>
        useCliniCardsPriceList({
          cacheKey: 'custom_key',
        })
      )

      await waitFor(() => {
        const cached = localStorage.getItem('custom_key')
        expect(cached).not.toBeNull()
      })
    })
  })

  describe('lastUpdated', () => {
    it('should set lastUpdated timestamp', async () => {
      mockApi.getPriceList.mockResolvedValueOnce({
        success: true,
        data: mockPriceList,
      })

      const { result } = renderHook(() => useCliniCardsPriceList())

      await waitFor(() => {
        expect(result.current.lastUpdated).not.toBeNull()
      })

      expect(result.current.lastUpdated).toBeInstanceOf(Date)
    })
  })
})
