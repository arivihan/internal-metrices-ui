import { apiClient } from './apiClient'
import { accessToken } from '@/signals/auth'
import type {
  ReelResponseDto,
  ReelFilters,
  ReelsPaginatedResponse,
  ReelCreateRequest,
  ReelUpdateRequest,
  ReelBulkUploadResponse,
  ReelBulkCreateResponse,
  TagFilters,
  TagsPaginatedResponse,
  PaginatedDropdownResponse,
  ExamOption,
  GradeOption,
  StreamOption,
} from '@/types/reels'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// ============================================================================
// REELS APIs
// ============================================================================

/**
 * Fetch paginated list of reels
 * GET /secure/api/v1/reels
 */
export const fetchReels = async (
  filters: ReelFilters = {}
): Promise<ReelsPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'createdAt',
    sortDir: filters.sortDir ?? 'DESC',
  }

  if (filters.isActive !== undefined) params.isActive = String(filters.isActive)
  if (filters.isGlobal !== undefined) params.isGlobal = String(filters.isGlobal)
  if (filters.examId) params.examId = String(filters.examId)
  if (filters.streamId) params.streamId = String(filters.streamId)
  if (filters.gradeId) params.gradeId = String(filters.gradeId)
  if (filters.language) params.language = filters.language
  if (filters.difficultyLevel) params.difficultyLevel = filters.difficultyLevel
  if (filters.tagIds && filters.tagIds.length > 0) {
    params.tagIds = JSON.stringify(filters.tagIds)
  }
  if (filters.search) params.search = filters.search
  if (filters.creatorId) params.creatorId = filters.creatorId

  console.log('[fetchReels] Request params:', params)

  try {
    const response = await apiClient<any>('/secure/api/v1/reels', { params })

    console.log('[fetchReels] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as ReelsPaginatedResponse
      }
      if ('content' in response) {
        return response as ReelsPaginatedResponse
      }
    }

    return {
      content: [],
      pageNumber: 0,
      pageSize: filters.pageSize ?? 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }
  } catch (error) {
    console.error('[fetchReels] Error:', error)
    throw error
  }
}

/**
 * Get reel by ID
 * GET /secure/api/v1/reels/{reelId}
 */
export const fetchReelById = async (reelId: number): Promise<ReelResponseDto> => {
  console.log('[fetchReelById] Fetching reel:', reelId)

  try {
    const response = await apiClient<any>(`/secure/api/v1/reels/${reelId}`)

    console.log('[fetchReelById] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as ReelResponseDto
      }
      return response as ReelResponseDto
    }

    throw new Error('Invalid response format')
  } catch (error) {
    console.error('[fetchReelById] Error:', error)
    throw error
  }
}

/**
 * Create a new reel
 * POST /secure/api/v1/reels
 */
export const createReel = async (data: ReelCreateRequest): Promise<ReelResponseDto> => {
  console.log('[createReel] Creating reel:', data)

  try {
    const response = await apiClient<any>('/secure/api/v1/reels', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    console.log('[createReel] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as ReelResponseDto
      }
      return response as ReelResponseDto
    }

    throw new Error('Invalid response format')
  } catch (error) {
    console.error('[createReel] Error:', error)
    throw error
  }
}

/**
 * Update a reel
 * PATCH /secure/api/v1/reels/{reelId}
 */
export const updateReel = async (
  reelId: number,
  data: ReelUpdateRequest
): Promise<ReelResponseDto> => {
  console.log('[updateReel] Updating reel:', { reelId, data })

  try {
    const response = await apiClient<any>(`/secure/api/v1/reels/${reelId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })

    console.log('[updateReel] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as ReelResponseDto
      }
      return response as ReelResponseDto
    }

    throw new Error('Invalid response format')
  } catch (error) {
    console.error('[updateReel] Error:', error)
    throw error
  }
}

/**
 * Delete reels by IDs
 * DELETE /secure/api/v1/reels/{reelIds}
 */
export const deleteReels = async (reelIds: number[]): Promise<string> => {
  console.log('[deleteReels] Deleting reels:', reelIds)

  try {
    // Format: /secure/api/v1/reels/1,2,3 (comma-separated IDs without brackets)
    const response = await apiClient<any>(`/secure/api/v1/reels?reelIds=${reelIds.join(',')}`, {
      method: 'DELETE',
    })

    console.log('[deleteReels] Response:', response)
    return response?.message || 'Reel(s) deleted successfully'
  } catch (error) {
    console.error('[deleteReels] Error:', error)
    throw error
  }
}

/**
 * Update reel status
 * PATCH /secure/api/v1/reels/{reelId}/status
 */
export const updateReelStatus = async (
  reelId: number,
  isActive: boolean
): Promise<ReelResponseDto> => {
  console.log('[updateReelStatus] Updating status:', { reelId, isActive })

  try {
    const response = await apiClient<any>(`/secure/api/v1/reels/${reelId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    })

    console.log('[updateReelStatus] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as ReelResponseDto
      }
      return response as ReelResponseDto
    }

    throw new Error('Invalid response format')
  } catch (error) {
    console.error('[updateReelStatus] Error:', error)
    throw error
  }
}

/**
 * Bulk upload reels via Excel
 * POST /secure/api/v1/reels/bulk/upload
 */
export const bulkUploadReels = async (
  file: File,
  params: {
    examId?: number
    gradeId?: number
    streamId?: number
    language?: string
  }
): Promise<ReelBulkUploadResponse> => {
  console.log('[bulkUploadReels] Starting upload:', {
    fileName: file.name,
    fileSize: file.size,
    params,
  })

  const formData = new FormData()
  formData.append('file', file)

  const queryParams = new URLSearchParams()
  if (params.examId) queryParams.append('examId', String(params.examId))
  if (params.gradeId) queryParams.append('gradeId', String(params.gradeId))
  if (params.streamId) queryParams.append('streamId', String(params.streamId))
  if (params.language) queryParams.append('language', params.language)

  const url = `/secure/api/v1/reels/bulk/upload?${queryParams.toString()}`

  const headers: HeadersInit = {}
  if (accessToken.value) {
    headers['avToken'] = accessToken.value
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Upload failed')
    }

    const result = await response.json()
    console.log('[bulkUploadReels] Response:', result)

    if (result.data) {
      return result.data as ReelBulkUploadResponse
    }
    return result as ReelBulkUploadResponse
  } catch (error) {
    console.error('[bulkUploadReels] Error:', error)
    throw error
  }
}

/**
 * Bulk save reels
 * POST /secure/api/v1/reels/bulk/save
 */
export const bulkSaveReels = async (
  reels: ReelBulkUploadResponse
): Promise<ReelBulkCreateResponse> => {
  console.log('[bulkSaveReels] Saving reels:', reels)

  try {
    const response = await apiClient<any>('/secure/api/v1/reels/bulk/save', {
      method: 'POST',
      body: JSON.stringify(reels),
    })

    console.log('[bulkSaveReels] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as ReelBulkCreateResponse
      }
      return response as ReelBulkCreateResponse
    }

    throw new Error('Invalid response format')
  } catch (error) {
    console.error('[bulkSaveReels] Error:', error)
    throw error
  }
}

// ============================================================================
// TAGS APIs
// ============================================================================

/**
 * Fetch paginated list of tags
 * GET /secure/api/v1/tags
 */
export const fetchTags = async (
  filters: TagFilters = {}
): Promise<TagsPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'createdAt',
    sortDir: filters.sortDir ?? 'ASC',
  }

  if (filters.search) params.search = filters.search

  console.log('[fetchTags] Request params:', params)

  try {
    const response = await apiClient<any>('/secure/api/v1/tags', { params })

    console.log('[fetchTags] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as TagsPaginatedResponse
      }
      if ('content' in response) {
        return response as TagsPaginatedResponse
      }
    }

    return {
      content: [],
      pageNumber: 0,
      pageSize: filters.pageSize ?? 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }
  } catch (error) {
    console.error('[fetchTags] Error:', error)
    throw error
  }
}

// ============================================================================
// EXAM/GRADE/STREAM APIs for Dropdowns
// ============================================================================

/**
 * Fetch paginated list of exams
 * GET /secure/api/v1/exam
 */
export const fetchExamsPaginated = async (
  filters: {
    pageNo?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    active?: boolean
  } = {}
): Promise<PaginatedDropdownResponse<ExamOption>> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'displayOrder',
    sortDir: filters.sortDir ?? 'ASC',
  }

  if (filters.search) params.search = filters.search
  if (filters.active !== undefined) params.active = String(filters.active)

  console.log('[fetchExamsPaginated] Request params:', params)

  try {
    const response = await apiClient<any>('/secure/api/v1/exam', { params })

    console.log('[fetchExamsPaginated] Response:', response)

    let result: PaginatedDropdownResponse<ExamOption> = {
      content: [],
      pageNumber: 0,
      pageSize: filters.pageSize ?? 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        const data = response.data
        result = {
          content: data.content || [],
          pageNumber: data.pageNumber ?? data.number ?? 0,
          pageSize: data.pageSize ?? data.size ?? 10,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 1,
          last: data.last ?? true,
        }
      } else if ('content' in response) {
        result = {
          content: response.content || [],
          pageNumber: response.pageNumber ?? response.number ?? 0,
          pageSize: response.pageSize ?? response.size ?? 10,
          totalElements: response.totalElements ?? 0,
          totalPages: response.totalPages ?? 1,
          last: response.last ?? true,
        }
      }
    }

    // Map to ExamOption format
    result.content = result.content.map((exam: any) => ({
      id: exam.id,
      name: exam.displayName || exam.name || exam.code || `Exam ${exam.id}`,
      code: exam.code,
      displayName: exam.displayName,
      isActive: exam.isActive,
    }))

    return result
  } catch (error) {
    console.error('[fetchExamsPaginated] Error:', error)
    throw error
  }
}

/**
 * Fetch paginated list of grades
 * GET /secure/api/v1/grade
 */
export const fetchGradesPaginated = async (
  filters: {
    pageNo?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    active?: boolean
  } = {}
): Promise<PaginatedDropdownResponse<GradeOption>> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'displayOrder',
    sortDir: filters.sortDir ?? 'ASC',
  }

  if (filters.search) params.search = filters.search
  if (filters.active !== undefined) params.active = String(filters.active)

  console.log('[fetchGradesPaginated] Request params:', params)

  try {
    const response = await apiClient<any>('/secure/api/v1/grade', { params })

    console.log('[fetchGradesPaginated] Response:', response)

    let result: PaginatedDropdownResponse<GradeOption> = {
      content: [],
      pageNumber: 0,
      pageSize: filters.pageSize ?? 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        const data = response.data
        result = {
          content: data.content || [],
          pageNumber: data.pageNumber ?? data.number ?? 0,
          pageSize: data.pageSize ?? data.size ?? 10,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 1,
          last: data.last ?? true,
        }
      } else if ('content' in response) {
        result = {
          content: response.content || [],
          pageNumber: response.pageNumber ?? response.number ?? 0,
          pageSize: response.pageSize ?? response.size ?? 10,
          totalElements: response.totalElements ?? 0,
          totalPages: response.totalPages ?? 1,
          last: response.last ?? true,
        }
      }
    }

    // Map to GradeOption format
    result.content = result.content.map((grade: any) => ({
      id: grade.id,
      name: grade.displayName || grade.name || grade.code || `Grade ${grade.id}`,
      code: grade.code,
      displayName: grade.displayName,
      isActive: grade.isActive,
    }))

    return result
  } catch (error) {
    console.error('[fetchGradesPaginated] Error:', error)
    throw error
  }
}

/**
 * Fetch paginated list of streams
 * GET /secure/api/v1/stream
 */
export const fetchStreamsPaginated = async (
  filters: {
    pageNo?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortDir?: 'ASC' | 'DESC'
    active?: boolean
  } = {}
): Promise<PaginatedDropdownResponse<StreamOption>> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'displayOrder',
    sortDir: filters.sortDir ?? 'ASC',
  }

  if (filters.search) params.search = filters.search
  if (filters.active !== undefined) params.active = String(filters.active)

  console.log('[fetchStreamsPaginated] Request params:', params)

  try {
    const response = await apiClient<any>('/secure/api/v1/stream', { params })

    console.log('[fetchStreamsPaginated] Response:', response)

    let result: PaginatedDropdownResponse<StreamOption> = {
      content: [],
      pageNumber: 0,
      pageSize: filters.pageSize ?? 10,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        const data = response.data
        result = {
          content: data.content || [],
          pageNumber: data.pageNumber ?? data.number ?? 0,
          pageSize: data.pageSize ?? data.size ?? 10,
          totalElements: data.totalElements ?? 0,
          totalPages: data.totalPages ?? 1,
          last: data.last ?? true,
        }
      } else if ('content' in response) {
        result = {
          content: response.content || [],
          pageNumber: response.pageNumber ?? response.number ?? 0,
          pageSize: response.pageSize ?? response.size ?? 10,
          totalElements: response.totalElements ?? 0,
          totalPages: response.totalPages ?? 1,
          last: response.last ?? true,
        }
      }
    }

    // Map to StreamOption format
    result.content = result.content.map((stream: any) => ({
      id: stream.id,
      name: stream.displayName || stream.name || stream.code || `Stream ${stream.id}`,
      code: stream.code,
      displayName: stream.displayName,
      isActive: stream.isActive,
    }))

    return result
  } catch (error) {
    console.error('[fetchStreamsPaginated] Error:', error)
    throw error
  }
}

// ============================================================================
// AUDIT TRAIL APIs
// ============================================================================

export interface AuditTrailEntry {
  id: string
  entityName: string
  entityId: string
  actionType: string
  performedBy: string
  timestamp: string
  oldValue: Record<string, any> | null
  newValue: Record<string, any> | null
}

export interface AuditTrailPaginatedResponse {
  content: AuditTrailEntry[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

/**
 * Fetch row-wise audit trail for a specific reel
 * GET /secure/api/v1/audit-logs/row?entityName=ReelEntity&entityId={id}
 */
export const fetchReelAuditTrail = async (
  reelId: number,
  pageNo: number = 0,
  pageSize: number = 10
): Promise<AuditTrailPaginatedResponse> => {
  console.log('[fetchReelAuditTrail] Fetching audit trail for reel:', reelId)

  try {
    const params: Record<string, string> = {
      entityName: 'ReelEntity',
      entityId: String(reelId),
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>('/secure/api/v1/audit-logs/row', { params })

    console.log('[fetchReelAuditTrail] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as AuditTrailPaginatedResponse
      }
      if ('content' in response) {
        return response as AuditTrailPaginatedResponse
      }
    }

    return {
      content: [],
      pageNumber: 0,
      pageSize: pageSize,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }
  } catch (error) {
    console.error('[fetchReelAuditTrail] Error:', error)
    throw error
  }
}

/**
 * Fetch table-wise audit trail for all reels
 * GET /secure/api/v1/audit-logs/table?entityName=ReelEntity
 */
export const fetchReelsTableAuditTrail = async (
  pageNo: number = 0,
  pageSize: number = 10
): Promise<AuditTrailPaginatedResponse> => {
  console.log('[fetchReelsTableAuditTrail] Fetching table audit trail')

  try {
    const params: Record<string, string> = {
      entityName: 'ReelEntity',
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>('/secure/api/v1/audit-logs/table', { params })

    console.log('[fetchReelsTableAuditTrail] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as AuditTrailPaginatedResponse
      }
      if ('content' in response) {
        return response as AuditTrailPaginatedResponse
      }
    }

    return {
      content: [],
      pageNumber: 0,
      pageSize: pageSize,
      totalElements: 0,
      totalPages: 0,
      last: true,
    }
  } catch (error) {
    console.error('[fetchReelsTableAuditTrail] Error:', error)
    throw error
  }
}
