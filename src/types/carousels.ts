// ============================================================================
// App Carousels Types
// ============================================================================

export type VisibilityType = 'SUBSCRIBED' | 'NON_SUBSCRIBED' | 'ALL'
export type NavigationType = 'EXTERNAL_IMAGE' | 'EXTERNAL_PDF' | 'EXTERNAL_LINK' | 'CLASS_PARAMS' | 'DEEPLINK' | 'INTERNAL_LINK' | 'INTERNAL_NOTE' 

// Carousel Batch Detail for responses
export interface CarouselBatchDetailResponse {
  batchId: number
  batchCode?: string
  displayOrder: number
  className?: string
  activityParams?: Record<string, any>
  navigationType: NavigationType
  parameter?: Record<string, Record<string, any>>
}

// Carousel Batch for create/update requests
export interface CarouselBatchRequest {
  batchId: number
  displayOrder: number
  className?: string
  activityParams?: Record<string, any>
  navigationType: NavigationType
  parameter?: Record<string, Record<string, any>>
}

// List response (for table)
export interface CarouselListResponse {
  id: number
  carouselCode: string
  url: string
  screenType: string
  visibilityType: VisibilityType
  isActive: boolean
  createdAt: string
  updatedAt: string
  batches?: CarouselBatchDetailResponse[]
}

// Detail response (for view/edit)
export interface CarouselDetailResponse {
  id: number
  carouselCode: string
  url: string
  screenType: string
  visibilityType: VisibilityType
  isActive: boolean
  batches: CarouselBatchDetailResponse[]
  createdAt?: string
  updatedAt?: string
  createdById?: string
  createdByName?: string
  updatedById?: string
  updatedByName?: string
}

// Create request (no isActive - it's set by server)
export interface CarouselCreateRequest {
  carouselCode: string
  url: string
  screenType: string
  visibilityType: VisibilityType
  batches: CarouselBatchRequest[]
}

// Update request
export interface CarouselUpdateRequest {
  carouselCode?: string
  url?: string
  screenType?: string
  visibilityType?: VisibilityType
  isActive?: boolean
  batches?: CarouselBatchRequest[]
}

// Paginated response
export interface CarouselPaginatedResponse {
  content: CarouselListResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Filters for fetching
export interface CarouselFilters {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
  active?: boolean
  batchId?: number
  screenType?: string
}

// Copy carousel item for mapping
export interface CopyCarouselItem {
  carouselId: number
  displayOrder: number
  sourceBatchId: number
}

// Copy carousel request
export interface CopyCarouselRequest {
  targetBatchIds: number[]
  carousels: CopyCarouselItem[]
}

// API Response wrapper
export interface ApiResponse<T> {
  message: string
  code: number
  data?: T
  success?: boolean
}

// Batch option for dropdowns
export interface BatchOption {
  id: number
  name: string
  code?: string
  displayName?: string
}

// Constants for dropdowns
export const VISIBILITY_TYPES: Record<VisibilityType, string> = {
  SUBSCRIBED: 'Subscribed',
  NON_SUBSCRIBED: 'Non-Subscribed',
  ALL: 'All',
}

export const NAVIGATION_TYPES: Record<NavigationType, string> = {
  EXTERNAL_IMAGE: 'External Image',
  EXTERNAL_PDF: 'External PDF',
  EXTERNAL_LINK: 'External Link',
  CLASS_PARAMS: 'Class Params',
  DEEPLINK: 'Deeplink',
  INTERNAL_LINK: 'Internal Link',
  INTERNAL_NOTE: 'Internal Note',
}

// Common screen types
export const SCREEN_TYPES: Record<string, string> = {
  HOME_SCREEN: 'Home Screen',
  DASHBOARD: 'Dashboard',
  TOPPER_NOTES: 'Topper Notes',
  TEST_SERIES: 'Tests Series',
  LIVE_CLASS: 'Live Class',
}
