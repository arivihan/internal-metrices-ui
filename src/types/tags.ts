// ============================================================================
// Tags Types
// ============================================================================

// Tag response from API
export interface TagResponse {
  id: number
  name: string
  slug: string
  createdAt: string
  reelCount: number
}

// Create/Update request
export interface TagRequest {
  name: string
  slug: string
}

// Paginated response
export interface TagPaginatedResponse {
  content: TagResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  entityName?: string | null
}

// Filters for fetching
export interface TagFilters {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
}

// API Response wrapper
export interface ApiResponse<T> {
  message: string
  code: number
  data?: T
  success?: boolean
}
