// Reel Response DTO
export interface ReelResponseDto {
  id: number
  uuid: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  language: 'ENGLISH' | 'HINDI'
  isGlobal: boolean
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  targeting: ReelTargeting[]
  tags: ReelTag[]
  stats: ReelStats
}

export interface ReelTargeting {
  id: number
  examId: number
  streamId: number
  gradeId: number
}

export interface ReelTag {
  tagId: number
  tagName: string
}

export interface ReelStats {
  totalViews: number
  uniqueViews: number
  totalLikes: number
  totalBookmarks: number
  totalComments: number
  totalShares: number
  totalNotInterested: number
  totalReports: number
  avgWatchPercentage: number
  avgWatchTimeSeconds: number
}

// Filters for fetching reels
export interface ReelFilters {
  pageNo?: number
  pageSize?: number
  isActive?: boolean
  isGlobal?: boolean
  examId?: number
  streamId?: number
  gradeId?: number
  language?: 'ENGLISH' | 'HINDI'
  difficultyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  tagIds?: number[]
  search?: string
  creatorId?: string
  sortBy?: 'id' | 'createdAt' | 'title' | 'viewCount' | 'likeCount'
  sortDir?: 'ASC' | 'DESC'
}

// Paginated response
export interface ReelsPaginatedResponse {
  content: ReelResponseDto[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Create/Update Reel Request
export interface ReelCreateRequest {
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  language: string
  isGlobal: boolean
  targeting: {
    examId: number
    streamId: number
    gradeId: number
  }[]
  tagIds: number[]
}

export interface ReelUpdateRequest {
  title?: string
  description?: string
  videoUrl?: string
  thumbnailUrl?: string
  durationSeconds?: number
  difficultyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  language?: 'ENGLISH' | 'HINDI'
  isGlobal?: boolean
  targeting?: {
    examId: number
    streamId: number
    gradeId: number
  }[]
  tagIds?: number[]
}

// Bulk Upload Types
export interface ReelBulkUploadResponse {
  reels: ReelUploadDto[]
  hasErrors: boolean
  errors: string[]
  totalRows: number
  errorCount: number
  validCount: number
  examId: number
  streamId: number
  gradeId: number
}

export interface ReelUploadDto {
  rowNumber: number
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  language: 'ENGLISH' | 'HINDI'
  isGlobal: boolean
  tagIds: number[]
  hasError: boolean
  errorMessage: string
}

export interface ReelBulkCreateResponse {
  totalAttempted: number
  successCount: number
  failureCount: number
  successfulReelIds: number[]
  errors: string[]
}

// Tag Types
export interface TagResponseDto {
  id: number
  name: string
  slug: string
  createdAt: string
  reelCount: number
}

export interface TagFilters {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
}

export interface TagsPaginatedResponse {
  content: TagResponseDto[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Exam/Grade/Stream Types for dropdowns
export interface ExamOption {
  id: number
  name: string
  code?: string
  displayName?: string
  isActive?: boolean
}

export interface GradeOption {
  id: number
  name: string
  code?: string
  displayName?: string
  isActive?: boolean
}

export interface StreamOption {
  id: number
  name: string
  code?: string
  displayName?: string
  isActive?: boolean
}

export interface PaginatedDropdownResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

// Supported Language type
export interface SupportedLanguage {
  id: number
  code: string
  displayNameEn: string
  nativeName: string
  displayOrder: number
  isActive: boolean
}
