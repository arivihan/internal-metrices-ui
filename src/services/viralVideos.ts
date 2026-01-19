
import { apiClient } from './apiClient'
import { accessToken } from '@/signals/auth'
import type {
  VideoResponseDto,
  VideoFilters,
  VideoPaginatedResponse,
  UploadVideoPayload,
  DuplicateVideoRequest,
  VideoUploadResponse,
  BatchOption,
} from '@/types/viralVideos'

// Base URL for API calls
import { API_CONFIG } from '@/config'

const BASE_URL = API_CONFIG.INTERNAL_METRICS_BASE

// ============================================================================
// VIRAL VIDEOS APIs
// ============================================================================

/**
 * Fetch paginated list of viral videos
 * GET /secure/viral-videos/api/v1/paginated
 */
export const fetchViralVideos = async (
  filters: VideoFilters = {}
): Promise<VideoPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'position',
    sortDir: filters.sortDir ?? 'ASC',
    active: String(filters.active ?? true),
  }

  if (filters.batchId) params.batchId = String(filters.batchId)
  if (filters.videoType) params.videoType = filters.videoType

  console.log('[fetchViralVideos] Request params:', params)

  try {
    const response = await apiClient<VideoPaginatedResponse>(
      '/secure/viral-videos/api/v1/paginated',
      { params }
    )

    console.log('[fetchViralVideos] Raw response:', response)

    // Handle the response
    if (response && typeof response === 'object') {
      // If response has a data wrapper, unwrap it
      if ('data' in response && response.data) {
        const unwrapped = response.data as VideoPaginatedResponse
        console.log('[fetchViralVideos] Unwrapped response:', unwrapped)
        return unwrapped
      }

      // If response is already in the correct format
      if ('content' in response && Array.isArray(response.content)) {
        console.log('[fetchViralVideos] Direct response:', response)
        return response as VideoPaginatedResponse
      }
    }

    console.warn('[fetchViralVideos] Unexpected response structure:', response)

    // Fallback for unexpected response structure
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageSize: filters.pageSize ?? 10,
      pageNumber: filters.pageNo ?? 0,
      last: true,
    }
  } catch (error) {
    console.error('[fetchViralVideos] Error:', error)
    throw error
  }
}

/**
 * Upload viral video files
 * POST /secure/viral-videos/api/v1/upload?batchId={batchId}
 */
export const uploadViralVideos = async (
  payload: UploadVideoPayload
): Promise<VideoUploadResponse> => {
  console.log('[uploadViralVideos] Starting upload with payload:', {
    fileCount: payload.files.length,
    fileNames: payload.files.map((f) => f.name),
    batchId: payload.batchId,
  })

  const formData = new FormData()

  // Append each file to formData with explicit filename
  payload.files.forEach((file, index) => {
    const fileName = file.name
    console.log(`[uploadViralVideos] Adding file ${index + 1}:`, {
      fileName,
      fileType: file.type,
      fileSize: file.size
    })
    formData.append('file', file, fileName)
  })

  // Build URL with query parameters
  const queryParams: string[] = []
  queryParams.push(`batchId=${payload.batchId}`)

  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
  const url = `${BASE_URL}/secure/viral-videos/api/v1/upload${queryString}`

  console.log('[uploadViralVideos] Request URL:', url)

  const headers: HeadersInit = {
    // Don't set Content-Type for FormData, let browser set it with boundary
  }

  if (accessToken.value) {
    headers['avToken'] = accessToken.value
  }

  console.log('[uploadViralVideos] Request headers:', headers)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    })

    console.log('[uploadViralVideos] Response status:', response.status)
    console.log('[uploadViralVideos] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let error
      const contentType = response.headers.get('content-type')

      try {
        if (contentType && contentType.includes('application/json')) {
          error = await response.json()
        } else {
          const textResponse = await response.text()
          console.log('[uploadViralVideos] Non-JSON error response:', textResponse)
          error = {
            message: textResponse || `HTTP Error ${response.status}: ${response.statusText}`,
            status: response.status,
            statusText: response.statusText
          }
        }
      } catch (parseError) {
        console.error('[uploadViralVideos] Error parsing response:', parseError)
        error = {
          message: `HTTP Error ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText
        }
      }

      console.error('[uploadViralVideos] Error response:', error)
      throw new Error(error.message || 'Upload failed')
    }

    const contentType = response.headers.get('content-type')
    let result

    try {
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
      } else {
        const textResponse = await response.text()
        console.log('[uploadViralVideos] Non-JSON success response:', textResponse)
        result = {
          success: true,
          message: textResponse || 'Upload completed successfully',
          data: null
        }
      }
    } catch (parseError) {
      console.error('[uploadViralVideos] Error parsing success response:', parseError)
      result = {
        success: true,
        message: 'Upload completed successfully',
        data: null
      }
    }

    console.log('[uploadViralVideos] Success response:', result)
    return result
  } catch (error) {
    console.error('[uploadViralVideos] Upload error:', error)
    throw error
  }
}

/**
 * Duplicate viral videos to multiple batches
 * POST /secure/viral-videos/api/v1/duplicate
 */
export const duplicateViralVideos = async (
  payload: DuplicateVideoRequest
): Promise<VideoUploadResponse> => {
  console.log('[duplicateViralVideos] Starting duplication with payload:', payload)

  try {
    const response = await apiClient<VideoUploadResponse>(
      '/secure/viral-videos/api/v1/duplicate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    console.log('[duplicateViralVideos] Response:', response)
    return response
  } catch (error) {
    console.error('[duplicateViralVideos] Error:', error)
    throw error
  }
}

/**
 * Fetch all batches for dropdown selection
 */
export const fetchAllBatchesForVideos = async (params?: {
  activeFlag?: boolean
}): Promise<BatchOption[]> => {
  const queryParams: Record<string, string> = {}

  if (params?.activeFlag !== undefined) {
    queryParams.activeFlag = String(params.activeFlag)
  }

  console.log('[fetchAllBatchesForVideos] Request params:', queryParams)

  try {
    const response = await apiClient<any>('/secure/api/v1/batch', {
      params: queryParams,
    })

    console.log('[fetchAllBatchesForVideos] Raw response:', response)

    let batchData = []

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        batchData = Array.isArray(response.data.content)
          ? response.data.content
          : Array.isArray(response.data)
            ? response.data
            : []
      } else if (Array.isArray(response.content)) {
        batchData = response.content
      } else if (Array.isArray(response)) {
        batchData = response
      }
    }

    // Map the response to match our expected structure
    const mappedBatches: BatchOption[] = batchData.map((batch: any) => ({
      id: batch.id,
      name: batch.displayName || batch.name || batch.code || `Batch ${batch.id}`,
      code: batch.code,
      displayName: batch.displayName,
      language: batch.language,
      examName: batch.examName,
      gradeName: batch.gradeName,
      streamName: batch.streamName,
      isActive: batch.isActive,
      active: batch.isActive,
    }))

    console.log('[fetchAllBatchesForVideos] Mapped batches:', mappedBatches)
    return mappedBatches
  } catch (error) {
    console.error('[fetchAllBatchesForVideos] Error:', error)
    throw error
  }
}
