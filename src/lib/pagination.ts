export const PAGE_SIZE_DEFAULT = 50
export const PAGE_SIZE_MAX = 100

export type PaginationParams = {
  page: number
  pageSize: number
  from: number
  to: number
}

export function parsePagination(
  searchParams: URLSearchParams
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(
    PAGE_SIZE_MAX,
    Math.max(
      1,
      parseInt(searchParams.get('pageSize') ?? String(PAGE_SIZE_DEFAULT), 10) ||
        PAGE_SIZE_DEFAULT
    )
  )
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { page, pageSize, from, to }
}

export function paginationMeta(
  page: number,
  pageSize: number,
  count: number | null
): { page: number; pageSize: number; total: number; totalPages: number } {
  const total = count ?? 0
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
}
