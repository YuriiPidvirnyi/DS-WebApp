import { useState, useEffect, useCallback } from 'react'
import { getCliniCardsApi, type PriceItem } from '../services/clinicardsApi'
import { monitoring } from '../services/monitoring'

interface PriceCategory {
  id: string
  name: string
  items: PriceItem[]
}

interface PriceListState {
  categories: PriceCategory[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface UsePriceListOptions {
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
  cacheKey?: string
}

const DEFAULT_CACHE_KEY = 'clinicards_price_list'
const DEFAULT_REFRESH_INTERVAL = 60 * 60 * 1000 // 1 hour

/**
 * Hook for managing CliniCards price list with caching and auto-refresh
 */
export const useCliniCardsPriceList = (options: UsePriceListOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    cacheKey = DEFAULT_CACHE_KEY,
  } = options

  const [state, setState] = useState<PriceListState>({
    categories: [],
    loading: true,
    error: null,
    lastUpdated: null,
  })

  // Load from localStorage cache
  const loadFromCache = useCallback((): PriceCategory[] | null => {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const age = Date.now() - timestamp

      // Cache expires after refreshInterval
      if (age > refreshInterval) {
        localStorage.removeItem(cacheKey)
        return null
      }

      return data
    } catch (error) {
      console.error('Failed to load price list from cache:', error)
      localStorage.removeItem(cacheKey)
      return null
    }
  }, [cacheKey, refreshInterval])

  // Save to localStorage cache
  const saveToCache = useCallback(
    (data: PriceCategory[]) => {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        )
      } catch (error) {
        console.error('Failed to save price list to cache:', error)
      }
    },
    [cacheKey]
  )

  // Fetch price list from API
  const fetchPriceList = useCallback(async (): Promise<PriceCategory[]> => {
    const startTime = Date.now()

    try {
      const api = getCliniCardsApi()
      const response = await api.getPriceList()

      // Track API call
      monitoring.trackMetric('timing.api', Date.now() - startTime, {
        endpoint: '/price-list',
        success: response.success.toString(),
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch price list')
      }

      // Group items by category
      const categoriesMap = new Map<string, PriceCategory>()

      response.data.forEach(item => {
        if (!categoriesMap.has(item.categoryId)) {
          categoriesMap.set(item.categoryId, {
            id: item.categoryId,
            name: item.categoryName,
            items: [],
          })
        }
        categoriesMap.get(item.categoryId)!.items.push(item)
      })

      const categories = Array.from(categoriesMap.values())

      // Sort categories and items by name
      categories.sort((a, b) => a.name.localeCompare(b.name, 'uk-UA'))
      categories.forEach(cat => {
        cat.items.sort((a, b) => a.name.localeCompare(b.name, 'uk-UA'))
      })

      return categories
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      monitoring.trackError(error as Error, 'error', {
        context: 'useCliniCardsPriceList.fetchPriceList',
        endpoint: '/price-list',
      })

      throw new Error(errorMessage)
    }
  }, [])

  // Load price list (cache-first strategy)
  const loadPriceList = useCallback(
    async (forceRefresh = false) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        // Try cache first
        if (!forceRefresh) {
          const cached = loadFromCache()
          if (cached) {
            setState({
              categories: cached,
              loading: false,
              error: null,
              lastUpdated: new Date(),
            })
            return
          }
        }

        // Fetch from API
        const categories = await fetchPriceList()

        setState({
          categories,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        })

        // Save to cache
        saveToCache(categories)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load price list'

        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
      }
    },
    [loadFromCache, fetchPriceList, saveToCache]
  )

  // Refresh price list
  const refresh = useCallback(() => {
    return loadPriceList(true)
  }, [loadPriceList])

  // Search in price list
  const search = useCallback(
    (query: string): PriceItem[] => {
      if (!query.trim()) return []

      const lowerQuery = query.toLowerCase()
      const results: PriceItem[] = []

      state.categories.forEach(category => {
        category.items.forEach(item => {
          if (
            item.name.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery) ||
            category.name.toLowerCase().includes(lowerQuery)
          ) {
            results.push(item)
          }
        })
      })

      return results
    },
    [state.categories]
  )

  // Get items by category
  const getItemsByCategory = useCallback(
    (categoryId: string): PriceItem[] => {
      const category = state.categories.find(cat => cat.id === categoryId)
      return category?.items || []
    },
    [state.categories]
  )

  // Get item by ID
  const getItemById = useCallback(
    (itemId: string): PriceItem | null => {
      for (const category of state.categories) {
        const item = category.items.find(i => i.id === itemId)
        if (item) return item
      }
      return null
    },
    [state.categories]
  )

  // Get price statistics
  const getStatistics = useCallback(() => {
    const allItems = state.categories.flatMap(cat => cat.items)

    if (allItems.length === 0) {
      return {
        totalItems: 0,
        totalCategories: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
      }
    }

    const prices = allItems.map(item => item.price)

    return {
      totalItems: allItems.length,
      totalCategories: state.categories.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
    }
  }, [state.categories])

  // Initial load
  useEffect(() => {
    void loadPriceList()
  }, [loadPriceList])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(() => {
      void loadPriceList(true)
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, loadPriceList])

  return {
    ...state,
    refresh,
    search,
    getItemsByCategory,
    getItemById,
    getStatistics,
  }
}

// Re-export types
export type { PriceItem, PriceCategory }
