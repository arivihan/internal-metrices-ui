// ============================================================================
// Home Screen Cards Types
// ============================================================================

export type IconMediaType = 'IMAGE' | 'LOTTIE' | 'SVG'
export type VisibilityType = 'VISIBLE' | 'HIDDEN' | 'CONDITIONAL' | 'SUBSCRIBED'
export type NavigationType = 'ACTIVITY' | 'DEEP_LINK' | 'WEB_VIEW' | 'EXTERNAL' | 'EXTERNAL_IMAGE'

// Card Batch Detail for responses
export interface CardBatchDetailResponse {
  batchId: number
  batchCode?: string
  displayOrder: number
  className: string
  activityParams: Record<string, any>
  navigationType: NavigationType
  parameter: Record<string, Record<string, any>>
}

// Card Batch for create/update requests
export interface CardBatchRequest {
  batchId: number
  displayOrder: number
  className: string
  activityParams: Record<string, any>
  navigationType: NavigationType
  parameter: Record<string, Record<string, any>>
}

// List response (for table)
export interface HomeScreenCardListResponse {
  id: number
  title: string
  icon: string
  iconMediaType: IconMediaType
  tag: string
  iconBackgroundColor: string
  tagBackgroundColor: string
  visibilityType: VisibilityType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Detail response (for view/edit)
export interface HomeScreenCardDetailResponse {
  id: number
  title: string
  icon: string
  iconBackgroundColor: string
  iconMediaType: IconMediaType
  tag: string
  tagBackgroundColor: string
  visibility: VisibilityType
  isActive: boolean
  batches: CardBatchDetailResponse[]
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

// Create request
export interface HomeScreenCardCreateRequest {
  title: string
  icon: string
  iconBackgroundColor: string
  iconMediaType: IconMediaType
  tag?: string
  tagBackgroundColor?: string
  visibility: VisibilityType
  isActive?: boolean
  batches: CardBatchRequest[]
}

// Update request
export interface HomeScreenCardUpdateRequest {
  title?: string
  icon?: string
  iconBackgroundColor?: string
  iconMediaType?: IconMediaType
  tag?: string
  tagBackgroundColor?: string
  visibility?: VisibilityType
  batches?: CardBatchRequest[]
}

// Paginated response
export interface HomeScreenCardPaginatedResponse {
  content: HomeScreenCardListResponse[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Filters for fetching
export interface HomeScreenCardFilters {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
  active?: boolean
  batchId?: number
}

// Copy card request
export interface CopyCardRequest {
  targetBatchIds: number[]
}

// API Response wrapper
export interface ApiResponse<T> {
  message: string
  code: number
  data?: T
  success?: boolean
}

// Constants for dropdowns
export const ICON_MEDIA_TYPES: Record<IconMediaType, string> = {
  IMAGE: 'Image',
  LOTTIE: 'Lottie Animation',
  SVG: 'SVG',
}

export const VISIBILITY_TYPES: Record<VisibilityType, string> = {
  VISIBLE: 'Visible',
  HIDDEN: 'Hidden',
  CONDITIONAL: 'Conditional',
  SUBSCRIBED: 'Subscribed',
}

export const NAVIGATION_TYPES: Record<NavigationType, string> = {
  ACTIVITY: 'Activity',
  DEEP_LINK: 'Deep Link',
  WEB_VIEW: 'Web View',
  EXTERNAL: 'External',
  EXTERNAL_IMAGE: 'External Image',
}
