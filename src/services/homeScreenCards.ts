import { apiClient } from './apiClient'
import type {
  HomeScreenCardListResponse,
  HomeScreenCardDetailResponse,
  HomeScreenCardCreateRequest,
  HomeScreenCardUpdateRequest,
  HomeScreenCardPaginatedResponse,
  HomeScreenCardFilters,
  CopyCardRequest,
  ApiResponse,
} from '@/types/homeScreenCards'

// ============================================================================
// HOME SCREEN CARDS APIs
// ============================================================================

/**
 * Fetch paginated list of home screen cards
 * GET /secure/api/v1/home-screen-cards?pageNo=0&pageSize=10&search=&sortBy=createdAt&sortDir=ASC&active=true&batchId=
 */
export const fetchHomeScreenCards = async (
  filters: HomeScreenCardFilters = {}
): Promise<HomeScreenCardPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'createdAt',
    sortDir: filters.sortDir ?? 'DESC',
  }

  if (filters.search) params.search = filters.search
  if (filters.active !== undefined) params.active = String(filters.active)
  if (filters.batchId) params.batchId = String(filters.batchId)

  console.log('[fetchHomeScreenCards] Request params:', params)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/home-screen-cards',
      { params }
    )

    console.log('[fetchHomeScreenCards] Raw response:', response)

    // Handle the response
    if (response && typeof response === 'object') {
      // If response has a data wrapper, unwrap it
      if ('data' in response && response.data) {
        const unwrapped = response.data as HomeScreenCardPaginatedResponse
        console.log('[fetchHomeScreenCards] Unwrapped response:', unwrapped)
        return unwrapped
      }

      // If response is already in the correct format
      if ('content' in response && Array.isArray(response.content)) {
        console.log('[fetchHomeScreenCards] Direct response:', response)
        return response as HomeScreenCardPaginatedResponse
      }
    }

    console.warn('[fetchHomeScreenCards] Unexpected response structure:', response)

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
    console.error('[fetchHomeScreenCards] Error:', error)
    throw error
  }
}

/**
 * Fetch home screen card by ID
 * GET /secure/api/v1/home-screen-cards/{id}
 */
export const fetchHomeScreenCardById = async (
  id: number
): Promise<HomeScreenCardDetailResponse> => {
  console.log('[fetchHomeScreenCardById] Fetching card:', id)

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/home-screen-cards/${id}`
    )

    console.log('[fetchHomeScreenCardById] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as HomeScreenCardDetailResponse
    }

    return response as HomeScreenCardDetailResponse
  } catch (error) {
    console.error('[fetchHomeScreenCardById] Error:', error)
    throw error
  }
}

/**
 * Create a new home screen card
 * POST /secure/api/v1/home-screen-cards
 */
export const createHomeScreenCard = async (
  cardData: HomeScreenCardCreateRequest
): Promise<HomeScreenCardDetailResponse> => {
  console.log('[createHomeScreenCard] Creating card:', cardData)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/home-screen-cards',
      {
        method: 'POST',
        body: JSON.stringify(cardData),
      }
    )

    console.log('[createHomeScreenCard] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as HomeScreenCardDetailResponse
    }

    return response as HomeScreenCardDetailResponse
  } catch (error) {
    console.error('[createHomeScreenCard] Error:', error)
    throw error
  }
}

/**
 * Update an existing home screen card
 * PUT /secure/api/v1/home-screen-cards/{id}
 */
export const updateHomeScreenCard = async (
  id: number,
  cardData: HomeScreenCardUpdateRequest
): Promise<HomeScreenCardDetailResponse> => {
  console.log('[updateHomeScreenCard] Updating card:', { id, cardData })

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/home-screen-cards/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(cardData),
      }
    )

    console.log('[updateHomeScreenCard] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as HomeScreenCardDetailResponse
    }

    return response as HomeScreenCardDetailResponse
  } catch (error) {
    console.error('[updateHomeScreenCard] Error:', error)
    throw error
  }
}

/**
 * Delete a home screen card
 * DELETE /secure/api/v1/home-screen-cards/{id}
 */
export const deleteHomeScreenCard = async (id: number): Promise<void> => {
  console.log('[deleteHomeScreenCard] Deleting card:', id)

  try {
    await apiClient<void>(`/secure/api/v1/home-screen-cards/${id}`, {
      method: 'DELETE',
    })

    console.log('[deleteHomeScreenCard] Card deleted successfully')
  } catch (error) {
    console.error('[deleteHomeScreenCard] Error:', error)
    throw error
  }
}

/**
 * Toggle home screen card status (activate/deactivate)
 * PATCH /secure/api/v1/home-screen-cards/{id}/status
 */
export const toggleHomeScreenCardStatus = async (
  id: number,
  isActive: boolean
): Promise<ApiResponse<void>> => {
  console.log('[toggleHomeScreenCardStatus] Toggling status:', { id, isActive })

  try {
    const response = await apiClient<ApiResponse<void>>(
      `/secure/api/v1/home-screen-cards/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }
    )

    console.log('[toggleHomeScreenCardStatus] Response:', response)
    return response
  } catch (error) {
    console.error('[toggleHomeScreenCardStatus] Error:', error)
    throw error
  }
}

/**
 * Copy/Map home screen cards to target batches
 * POST /secure/api/v1/home-screen-cards/map
 */
export const copyHomeScreenCard = async (
  request: CopyCardRequest
): Promise<ApiResponse<void>> => {
  console.log('[copyHomeScreenCard] Mapping cards:', request)

  try {
    const response = await apiClient<ApiResponse<void>>(
      `/secure/api/v1/home-screen-cards/map`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )

    console.log('[copyHomeScreenCard] Response:', response)
    return response
  } catch (error) {
    console.error('[copyHomeScreenCard] Error:', error)
    throw error
  }
}

/**
 * Fetch all batches for dropdown selection
 */
export const fetchAllBatchesForCards = async (params?: {
  activeFlag?: boolean
}): Promise<any[]> => {
  const queryParams: Record<string, string> = {}

  if (params?.activeFlag !== undefined) {
    queryParams.activeFlag = String(params.activeFlag)
  }

  console.log('[fetchAllBatchesForCards] Request params:', queryParams)

  try {
    const response = await apiClient<any>('/secure/api/v1/batch', {
      params: queryParams,
    })

    console.log('[fetchAllBatchesForCards] Raw response:', response)

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
    const mappedBatches = batchData.map((batch: any) => ({
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

    console.log('[fetchAllBatchesForCards] Mapped batches:', mappedBatches)
    return mappedBatches
  } catch (error) {
    console.error('[fetchAllBatchesForCards] Error:', error)
    throw error
  }
}
