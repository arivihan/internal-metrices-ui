import { apiClient } from './apiClient'
import type {
  CarouselListResponse,
  CarouselDetailResponse,
  CarouselCreateRequest,
  CarouselUpdateRequest,
  CarouselPaginatedResponse,
  CarouselFilters,
  CopyCarouselRequest,
  ApiResponse,
  BatchOption,
} from '@/types/carousels'

// ============================================================================
// APP CAROUSELS APIs
// ============================================================================

/**
 * Fetch paginated list of carousels
 * GET /secure/api/v1/av-carousels?pageNo=0&pageSize=10&search=&sortBy=displayOrder&sortDir=ASC&active=true&batchId=&screenType=
 */
export const fetchCarousels = async (
  filters: CarouselFilters = {}
): Promise<CarouselPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'createdAt',
    sortDir: filters.sortDir ?? 'DESC',
  }

  if (filters.search) params.search = filters.search
  if (filters.active !== undefined) params.active = String(filters.active)
  if (filters.batchId) params.batchId = String(filters.batchId)
  if (filters.screenType) params.screenType = filters.screenType

  console.log('[fetchCarousels] Request params:', params)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/av-carousels',
      { params }
    )

    console.log('[fetchCarousels] Raw response:', response)

    // Handle the response
    if (response && typeof response === 'object') {
      // If response has a data wrapper, unwrap it
      if ('data' in response && response.data) {
        const unwrapped = response.data as CarouselPaginatedResponse
        console.log('[fetchCarousels] Unwrapped response:', unwrapped)
        return unwrapped
      }

      // If response is already in the correct format
      if ('content' in response && Array.isArray(response.content)) {
        console.log('[fetchCarousels] Direct response:', response)
        return response as CarouselPaginatedResponse
      }
    }

    console.warn('[fetchCarousels] Unexpected response structure:', response)

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
    console.error('[fetchCarousels] Error:', error)
    throw error
  }
}

/**
 * Fetch carousel by ID
 * GET /secure/api/v1/av-carousels/{id}
 */
export const fetchCarouselById = async (
  id: number
): Promise<CarouselDetailResponse> => {
  console.log('[fetchCarouselById] Fetching carousel:', id)

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/av-carousels/${id}`
    )

    console.log('[fetchCarouselById] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as CarouselDetailResponse
    }

    return response as CarouselDetailResponse
  } catch (error) {
    console.error('[fetchCarouselById] Error:', error)
    throw error
  }
}

/**
 * Create a new carousel
 * POST /secure/api/v1/av-carousels
 */
export const createCarousel = async (
  carouselData: CarouselCreateRequest
): Promise<CarouselDetailResponse> => {
  console.log('[createCarousel] Creating carousel:', carouselData)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/av-carousels',
      {
        method: 'POST',
        body: JSON.stringify(carouselData),
      }
    )

    console.log('[createCarousel] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as CarouselDetailResponse
    }

    return response as CarouselDetailResponse
  } catch (error) {
    console.error('[createCarousel] Error:', error)
    throw error
  }
}

/**
 * Update an existing carousel
 * PUT /secure/api/v1/av-carousels/{id}
 */
export const updateCarousel = async (
  id: number,
  carouselData: CarouselUpdateRequest
): Promise<CarouselDetailResponse> => {
  console.log('[updateCarousel] Updating carousel:', { id, carouselData })

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/av-carousels/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(carouselData),
      }
    )

    console.log('[updateCarousel] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as CarouselDetailResponse
    }

    return response as CarouselDetailResponse
  } catch (error) {
    console.error('[updateCarousel] Error:', error)
    throw error
  }
}

/**
 * Delete a carousel (hard delete)
 * DELETE /secure/api/v1/av-carousels/{id}
 */
export const deleteCarousel = async (id: number): Promise<ApiResponse<void>> => {
  console.log('[deleteCarousel] Deleting carousel:', id)

  try {
    const response = await apiClient<ApiResponse<void>>(
      `/secure/api/v1/av-carousels/${id}`,
      {
        method: 'DELETE',
      }
    )

    console.log('[deleteCarousel] Carousel deleted successfully')
    return response
  } catch (error) {
    console.error('[deleteCarousel] Error:', error)
    throw error
  }
}

/**
 * Toggle carousel status (activate/deactivate)
 * PATCH /secure/api/v1/av-carousels/{id}/status
 */
export const toggleCarouselStatus = async (
  id: number,
  isActive: boolean
): Promise<ApiResponse<void>> => {
  console.log('[toggleCarouselStatus] Toggling status:', { id, isActive })

  try {
    const response = await apiClient<ApiResponse<void>>(
      `/secure/api/v1/av-carousels/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }
    )

    console.log('[toggleCarouselStatus] Response:', response)
    return response
  } catch (error) {
    console.error('[toggleCarouselStatus] Error:', error)
    throw error
  }
}

/**
 * Copy/Map carousels to target batches
 * POST /secure/api/v1/av-carousels/map
 */
export const copyCarousel = async (
  request: CopyCarouselRequest
): Promise<ApiResponse<void>> => {
  console.log('[copyCarousel] Mapping carousels:', request)

  try {
    const response = await apiClient<ApiResponse<void>>(
      `/secure/api/v1/av-carousels/map`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )

    console.log('[copyCarousel] Response:', response)
    return response
  } catch (error) {
    console.error('[copyCarousel] Error:', error)
    throw error
  }
}

/**
 * Fetch all batches for dropdown selection
 */
export const fetchAllBatchesForCarousels = async (params?: {
  activeFlag?: boolean
}): Promise<BatchOption[]> => {
  const queryParams: Record<string, string> = {}

  if (params?.activeFlag !== undefined) {
    queryParams.activeFlag = String(params.activeFlag)
  }

  console.log('[fetchAllBatchesForCarousels] Request params:', queryParams)

  try {
    const response = await apiClient<any>('/secure/api/v1/batch', {
      params: queryParams,
    })

    console.log('[fetchAllBatchesForCarousels] Raw response:', response)

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
    }))

    console.log('[fetchAllBatchesForCarousels] Mapped batches:', mappedBatches)
    return mappedBatches
  } catch (error) {
    console.error('[fetchAllBatchesForCarousels] Error:', error)
    throw error
  }
}

// ============================================================================
// AUDIT TRAIL APIs
// ============================================================================

/**
 * Fetch audit trail for a specific carousel
 * GET /secure/api/v1/audit-logs/row?entityName=AvCarouselEntity&entityId={id}&pageNo=0&pageSize=10
 */
export const fetchCarouselAuditTrail = async (
  carouselId: number,
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  console.log('[fetchCarouselAuditTrail] Fetching audit trail for carousel:', carouselId)

  try {
    const params: Record<string, string> = {
      entityName: 'AvCarousel',
      entityId: String(carouselId),
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>('/secure/api/v1/audit-logs/row', {
      params,
    })

    console.log('[fetchCarouselAuditTrail] Response:', response)

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
    console.error('[fetchCarouselAuditTrail] Error:', error)
    throw error
  }
}

/**
 * Fetch table-wide audit trail for all carousels
 * GET /secure/api/v1/audit-logs/table?entityName=AvCarouselEntity&pageNo=0&pageSize=10
 */
export const fetchCarouselsTableAuditTrail = async (
  pageNo: number = 0,
  pageSize: number = 10
): Promise<any> => {
  console.log('[fetchCarouselsTableAuditTrail] Fetching table audit trail')

  try {
    const params: Record<string, string> = {
      entityName: 'AvCarousel',
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>('/secure/api/v1/audit-logs/table', {
      params,
    })

    console.log('[fetchCarouselsTableAuditTrail] Response:', response)

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
    console.error('[fetchCarouselsTableAuditTrail] Error:', error)
    throw error
  }
}
