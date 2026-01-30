export interface VideoBatchInfo {
  batchId: number
  batchName: string
  batchCode: string
}

export interface VideoResponseDto {
  id: string
  url: string
  thumbnailUrl: string
  videoOrientation: 'PORTRAIT' | 'LANDSCAPE'
  displayContext: string
  displayOrder: number
  isActive: boolean
  type: string
  code: string
  batches: VideoBatchInfo[]
}

export interface VideoFilters {
  pageNo?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
  active?: boolean
  batchId?: number
  videoType?: string
}

export interface VideoPaginatedResponse {
  content: VideoResponseDto[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface UploadVideoPayload {
  files: File[]
  batchId: number
}

export interface MapVideoRequest {
  targetBatchIds: number[]
  selectedVideos: SelectedVideoForMap[]
}

export interface SelectedVideoForMap {
  videoId: number
  displayOrder: number
  sourceBatchId: number
}

export interface MapVideoResponse {
  message: string
  code: number
  success: boolean
}

// Request DTO for creating/updating videos
export interface VideoRequest {
  code?: string
  url?: string
  thumbnailUrl?: string
  orientation?: string
  context?: string
  type?: string
  displayOrder?: number
  isActive?: boolean
}

export interface VideoUploadResponse {
  code?: string | null
  message: string
  uploadedVideos?: number
  failedVideos?: number
  errorDetails?: string[]
  success: boolean
}

export interface BatchOption {
  id: number
  name: string
  code?: string
  displayName?: string
  language?: string
  examName?: string
  gradeName?: string
  streamName?: string
  isActive?: boolean
  active?: boolean
}

// Video types for display
export const VIDEO_TYPES: Record<string, string> = {
  CHAMPIONS_OF_ARIVIHAN: 'Champions of Arivihan',
  VIRAL_VIDEOS: 'Viral Videos',
}

// Video orientations
export const VIDEO_ORIENTATIONS: Record<string, string> = {
  PORTRAIT: 'Portrait',
  LANDSCAPE: 'Landscape',
}

// Display contexts
export const DISPLAY_CONTEXTS: Record<string, string> = {
  HOMESCREEN: 'Home Screen',
  TOPPER_SCREEN: 'Topper Screen',
  SUBSCRIPTION_SCREEN: 'Subscription Screen',
  ONBOARDING_SCREEN: 'Onboarding Screen',
  OTHER: 'Other',
}
