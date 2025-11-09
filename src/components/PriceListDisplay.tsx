import React, { useState, useMemo } from 'react'
import {
  Search,
  DollarSign,
  Clock,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
} from 'lucide-react'
import {
  useCliniCardsPriceList,
  type PriceCategory,
} from '../hooks/useCliniCardsPriceList'

interface PriceListDisplayProps {
  showSearch?: boolean
  showFilters?: boolean
  showStatistics?: boolean
  allowDownload?: boolean
  onItemClick?: (itemId: string) => void
}

/**
 * Price list display component with CliniCards integration
 */
export const PriceListDisplay: React.FC<PriceListDisplayProps> = ({
  showSearch = true,
  showFilters = true,
  showStatistics = true,
  allowDownload = true,
  onItemClick,
}) => {
  const {
    categories,
    loading,
    error,
    lastUpdated,
    refresh,
    search: searchInPriceList,
    getStatistics,
  } = useCliniCardsPriceList()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  )

  // Filter and sort items
  const filteredCategories = useMemo(() => {
    let filtered: PriceCategory[] = categories

    // Filter by search query
    if (searchQuery.trim()) {
      const searchResults = searchInPriceList(searchQuery)
      const resultsByCategory = new Map<string, typeof searchResults>()

      searchResults.forEach(item => {
        if (!resultsByCategory.has(item.categoryId)) {
          resultsByCategory.set(item.categoryId, [])
        }
        resultsByCategory.get(item.categoryId)!.push(item)
      })

      filtered = Array.from(resultsByCategory.entries()).map(
        ([categoryId, items]) => {
          const category = categories.find(cat => cat.id === categoryId)!
          return {
            id: categoryId,
            name: category.name,
            items,
          }
        }
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cat => cat.id === selectedCategory)
    }

    // Sort items within each category
    filtered.forEach(category => {
      category.items.sort((a, b) => {
        let comparison = 0

        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name, 'uk-UA')
        } else {
          comparison = a.price - b.price
        }

        return sortOrder === 'asc' ? comparison : -comparison
      })
    })

    return filtered
  }, [
    categories,
    searchQuery,
    selectedCategory,
    sortBy,
    sortOrder,
    searchInPriceList,
  ])

  const stats = getStatistics()

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedCategories(new Set(categories.map(cat => cat.id)))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  const downloadPriceList = () => {
    const csvContent = [
      ['Категорія', 'Послуга', 'Ціна (грн)', 'Тривалість (хв)', 'Опис'].join(
        ','
      ),
      ...categories.flatMap(category =>
        category.items.map(item =>
          [
            `"${category.name}"`,
            `"${item.name}"`,
            item.price,
            item.duration || '',
            `"${item.description || ''}"`,
          ].join(',')
        )
      ),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `price-list-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Завантаження прайсу...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Info className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-900 mb-2">
          Помилка завантаження
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => void refresh()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Спробувати ще раз
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Прайс послуг</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-600 mt-1">
              Оновлено: {lastUpdated.toLocaleString('uk-UA')}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {allowDownload && (
            <button
              onClick={downloadPriceList}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              <Download className="w-5 h-5" />
              Завантажити
            </button>
          )}

          <button
            onClick={() => void refresh()}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Оновити
          </button>
        </div>
      </div>

      {/* Statistics */}
      {showStatistics && stats.totalItems > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">Всього послуг</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.totalItems}
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">Категорій</p>
            <p className="text-2xl font-bold text-green-900">
              {stats.totalCategories}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700">Мін. ціна</p>
            <p className="text-2xl font-bold text-purple-900">
              {stats.minPrice} грн
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-700">Макс. ціна</p>
            <p className="text-2xl font-bold text-orange-900">
              {stats.maxPrice} грн
            </p>
          </div>

          <div className="p-4 bg-pink-50 rounded-lg">
            <p className="text-sm text-pink-700">Середня ціна</p>
            <p className="text-2xl font-bold text-pink-900">
              {Math.round(stats.avgPrice)} грн
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            {showSearch && (
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Пошук послуг..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Category Filter */}
            {showFilters && (
              <>
                <div>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Всі категорії</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.items.length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={e =>
                      setSortBy(e.target.value as 'name' | 'price')
                    }
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="name">За назвою</option>
                    <option value="price">За ціною</option>
                  </select>

                  <button
                    onClick={() =>
                      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
                    }
                    className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                    title={
                      sortOrder === 'asc' ? 'За зростанням' : 'За спаданням'
                    }
                  >
                    {sortOrder === 'asc' ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Expand/Collapse All */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={expandAll}
              className="text-sm text-primary hover:underline"
            >
              Розгорнути всі
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-primary hover:underline"
            >
              Згорнути всі
            </button>
          </div>
        </div>
      )}

      {/* Price List */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Нічого не знайдено</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map(category => {
            const isExpanded = expandedCategories.has(category.id)

            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{category.name}</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {category.items.length} послуг
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="divide-y">
                    {category.items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => onItemClick?.(item.id)}
                        className={`p-6 hover:bg-gray-50 transition-colors ${
                          onItemClick ? 'cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg mb-1">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {item.description}
                              </p>
                            )}
                            {item.duration && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>{item.duration} хв</span>
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                              <DollarSign className="w-6 h-6" />
                              <span>{item.price}</span>
                            </div>
                            <p className="text-sm text-gray-500">грн</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
