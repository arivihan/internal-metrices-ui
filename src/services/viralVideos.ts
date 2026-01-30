
import { apiClient } from './apiClient'
import { accessToken } from '@/signals/auth'
import type {
  VideoResponseDto,
  VideoFilters,
  VideoPaginatedResponse,
  UploadVideoPayload,
  MapVideoRequest,
  MapVideoResponse,
  VideoUploadResponse,
  BatchOption,
  VideoRequest,
} from '@/types/viralVideos'

// ============================================================================
// VIRAL VIDEOS APIs
// ============================================================================

/**
 * Fetch paginated list of viral videos
 * GET /secure/api/v1/viral-videos?pageNo=0&pageSize=10&sortBy=position&sortDir=ASC&active=true
 */
export const fetchViralVideos = async (
  filters: VideoFilters = {}
): Promise<VideoPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'position',
    sortDir: filters.sortDir ?? 'ASC',
  }

  // Only add active filter if explicitly set
  if (filters.active !== undefined) {
    params.active = String(filters.active)
  }

  if (filters.batchId) params.batchId = String(filters.batchId)
  if (filters.videoType) params.videoType = filters.videoType

  console.log('[fetchViralVideos] Request params:', params)

  try {
    const response = await apiClient<VideoPaginatedResponse>(
      '/secure/api/v1/videos',
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
 * Fetch video by ID
 * GET /secure/api/v1/viral-videos/{id}
 */
export const fetchVideoById = async (id: string): Promise<VideoResponseDto> => {
  console.log('[fetchVideoById] Fetching video:', id)

  try {
    const response = await apiClient<VideoResponseDto>(
      `/secure/api/v1/videos/${id}`
    )

    console.log('[fetchVideoById] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as VideoResponseDto
    }

    return response
  } catch (error) {
    console.error('[fetchVideoById] Error:', error)
    throw error
  }
}

/**
 * Create a new video
 * POST /secure/api/v1/viral-videos?batchId={batchId}
 */
export const createVideo = async (
  videoData: VideoRequest,
  batchId: number
): Promise<VideoResponseDto> => {
  console.log('[createVideo] Creating video:', { videoData, batchId })

  try {
    const response = await apiClient<VideoResponseDto>(
      `/secure/api/v1/videos?batchId=${batchId}`,
      {
        method: 'POST',
        body: JSON.stringify(videoData),
      }
    )

    console.log('[createVideo] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as VideoResponseDto
    }

    return response
  } catch (error) {
    console.error('[createVideo] Error:', error)
    throw error
  }
}

/**
 * Update an existing video
 * PATCH /secure/api/v1/viral-videos/{id}
 */
export const updateVideo = async (
  id: string,
  videoData: Partial<VideoRequest>
): Promise<VideoResponseDto> => {
  console.log('[updateVideo] Updating video:', { id, videoData })

  try {
    const response = await apiClient<VideoResponseDto>(
      `/secure/api/v1/videos/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(videoData),
      }
    )

    console.log('[updateVideo] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as VideoResponseDto
    }

    return response
  } catch (error) {
    console.error('[updateVideo] Error:', error)
    throw error
  }
}

/**
 * Toggle video status (activate/deactivate)
 * PATCH /secure/api/v1/viral-videos/{id}/status
 */
export const toggleVideoStatus = async (
  id: string,
  isActive: boolean
): Promise<VideoResponseDto> => {
  console.log('[toggleVideoStatus] Toggling status:', { id, isActive })

  try {
    const response = await apiClient<VideoResponseDto>(
      `/secure/api/v1/videos/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }
    )

    console.log('[toggleVideoStatus] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data as VideoResponseDto
    }

    return response
  } catch (error) {
    console.error('[toggleVideoStatus] Error:', error)
    throw error
  }
}

/**
 * Delete a video
 * DELETE /secure/api/v1/viral-videos/{id}
 */
export const deleteVideo = async (id: string): Promise<void> => {
  console.log('[deleteVideo] Deleting video:', id)

  try {
    await apiClient<void>(`/secure/api/v1/videos/${id}`, {
      method: 'DELETE',
    })

    console.log('[deleteVideo] Video deleted successfully')
  } catch (error) {
    console.error('[deleteVideo] Error:', error)
    throw error
  }
}

/**
 * Upload viral video files
 * POST /secure/api/v1/viral-videos/upload?batchId={batchId}
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

  // Build URL with query parameters - match notes service pattern
  const endpoint = `/secure/api/v1/videos/upload?batchId=${payload.batchId}`
  const url = `/api${endpoint}`

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
 * Map (duplicate) viral videos to multiple batches
 * POST /secure/api/v1/videos/map
 */
export const mapViralVideos = async (
  payload: MapVideoRequest
): Promise<MapVideoResponse> => {
  console.log('[mapViralVideos] Starting video mapping with payload:', payload)

  try {
    const response = await apiClient<MapVideoResponse>(
      '/secure/api/v1/videos/map',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    console.log('[mapViralVideos] Response:', response)
    return response
  } catch (error) {
    console.error('[mapViralVideos] Error:', error)
    throw error
  }
}

// ============================================================================
// AUDIT TRAIL APIs
// ============================================================================

/**
 * Fetch audit trail for a specific video
 * GET /secure/api/v1/audit-logs/row?entityName=VideoEntity&entityId={id}&pageNo=0&pageSize=10
 */
export const fetchVideoAuditTrail = async (
  videoId: string,
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  console.log('[fetchVideoAuditTrail] Fetching audit trail for video:', videoId)

  try {
    const params: Record<string, string> = {
      entityName: 'VideoEntity',
      entityId: videoId,
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>('/secure/api/v1/audit-logs/row', {
      params,
    })

    console.log('[fetchVideoAuditTrail] Response:', response)

    // Handle different response formats
    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data
      }
      return response
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageSize,
      pageNumber: pageNo,
    }
  } catch (error) {
    console.error('[fetchVideoAuditTrail] Error:', error)
    throw error
  }
}

/**
 * Fetch table-wide audit trail for all viral videos
 * GET /secure/api/v1/audit-logs/table?entityName=VideoEntity&pageNo=0&pageSize=10
 */
export const fetchVideosTableAuditTrail = async (
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  console.log('[fetchVideosTableAuditTrail] Fetching table audit trail')

  try {
    const params: Record<string, string> = {
      entityName: 'VideoEntity',
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>('/secure/api/v1/audit-logs/table', {
      params,
    })

    console.log('[fetchVideosTableAuditTrail] Response:', response)

    // Handle different response formats
    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data
      }
      return response
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageSize,
      pageNumber: pageNo,
    }
  } catch (error) {
    console.error('[fetchVideosTableAuditTrail] Error:', error)
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
