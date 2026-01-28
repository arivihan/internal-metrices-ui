// ============================================================================
// Home Screen Cards Types
// ============================================================================

export type IconMediaType = 'IMAGE' | 'GIF' | 'DYNAMIC_IMAGE'
export type VisibilityType = 'SUBSCRIBED' | 'NON_SUBSCRIBED' | 'ALL'
export type NavigationType = 'EXTERNAL_IMAGE' | 'EXTERNAL_PDF' | 'EXTERNAL_LINK' | 'CLASS_PARAMS' | 'DEEPLINK' | 'INTERNAL_LINK' | 'INTERNAL_NOTE'

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
  sourceBatchId: number
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
  GIF: 'GIF',
  DYNAMIC_IMAGE: 'Dynamic Image',
}

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
