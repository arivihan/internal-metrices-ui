export interface VideoResponseDto {
  id: string
  videoUrl: string
  thumbnailUrl: string
  videoOrientation: 'PORTRAIT' | 'LANDSCAPE'
  displayContext: string
  position: number
  batchId: number
  isActive: boolean
  videoType: string
  videoCode: string
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

export interface DuplicateVideoRequest {
  selectedVideos: SelectedVideo[]
  targetBatchIds: number[]
}

export interface SelectedVideo {
  batchId: number
  videoCode: string
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
  TESTIMONIAL: 'Testimonial',
  PROMOTIONAL: 'Promotional',
  TUTORIAL: 'Tutorial',
  OTHER: 'Other',
}

// Video orientations
export const VIDEO_ORIENTATIONS: Record<string, string> = {
  PORTRAIT: 'Portrait',
  LANDSCAPE: 'Landscape',
}

// Display contexts
export const DISPLAY_CONTEXTS: Record<string, string> = {
  HOMESCREEN: 'Home Screen',
  COURSE_PAGE: 'Course Page',
  PROFILE: 'Profile',
  OTHER: 'Other',
}
