import { apiClient } from './apiClient'
import type {
  TagResponse,
  TagRequest,
  TagPaginatedResponse,
  TagFilters,
  ApiResponse,
} from '@/types/tags'

// ============================================================================
// TAGS APIs
// ============================================================================

/**
 * Fetch paginated list of tags
 * GET /secure/api/v1/tags?pageNo=0&pageSize=10&search=&sortBy=createdAt&sortDir=ASC
 */
export const fetchTags = async (
  filters: TagFilters = {}
): Promise<TagPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'createdAt',
    sortDir: filters.sortDir ?? 'DESC',
  }

  if (filters.search) params.search = filters.search

  console.log('[fetchTags] Request params:', params)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/tags',
      { params }
    )

    console.log('[fetchTags] Raw response:', response)

    // Handle the response
    if (response && typeof response === 'object') {
      // If response has a data wrapper, unwrap it
      if ('data' in response && response.data) {
        const unwrapped = response.data as TagPaginatedResponse
        console.log('[fetchTags] Unwrapped response:', unwrapped)
        return unwrapped
      }

      // If response is already in the correct format
      if ('content' in response && Array.isArray(response.content)) {
        console.log('[fetchTags] Direct response:', response)
        return response as TagPaginatedResponse
      }
    }

    console.warn('[fetchTags] Unexpected response structure:', response)

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
    console.error('[fetchTags] Error:', error)
    throw error
  }
}

/**
 * Fetch tag by ID
 * GET /secure/api/v1/tags/{tagId}
 */
export const fetchTagById = async (
  id: number
): Promise<TagResponse> => {
  console.log('[fetchTagById] Fetching tag:', id)

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/tags/${id}`
    )

    console.log('[fetchTagById] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as TagResponse
    }

    return response as TagResponse
  } catch (error) {
    console.error('[fetchTagById] Error:', error)
    throw error
  }
}

/**
 * Create a new tag
 * POST /secure/api/v1/tags
 */
export const createTag = async (
  tagData: TagRequest
): Promise<TagResponse> => {
  console.log('[createTag] Creating tag:', tagData)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/tags',
      {
        method: 'POST',
        body: JSON.stringify(tagData),
      }
    )

    console.log('[createTag] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as TagResponse
    }

    return response as TagResponse
  } catch (error) {
    console.error('[createTag] Error:', error)
    throw error
  }
}

/**
 * Update an existing tag
 * PUT /secure/api/v1/tags/{tagId}
 */
export const updateTag = async (
  id: number,
  tagData: TagRequest
): Promise<TagResponse> => {
  console.log('[updateTag] Updating tag:', { id, tagData })

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/tags/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(tagData),
      }
    )

    console.log('[updateTag] Response:', response)

    // Handle data wrapper
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as TagResponse
    }

    return response as TagResponse
  } catch (error) {
    console.error('[updateTag] Error:', error)
    throw error
  }
}

/**
 * Delete a tag
 * DELETE /secure/api/v1/tags/{tagId}
 */
export const deleteTag = async (id: number): Promise<void> => {
  console.log('[deleteTag] Deleting tag:', id)

  try {
    await apiClient<void>(`/secure/api/v1/tags/${id}`, {
      method: 'DELETE',
    })

    console.log('[deleteTag] Tag deleted successfully')
  } catch (error) {
    console.error('[deleteTag] Error:', error)
    throw error
  }
}
