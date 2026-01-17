import { apiClient } from './apiClient'
import { accessToken } from '@/signals/auth'

// ============================================================================
// API Response Types
// ============================================================================

interface ApiResponse<T> {
  code: number
  message: string
  success: boolean
  data: T
}

interface PaginatedResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ============================================================================
// NOTES Types
// ============================================================================

export interface NotesResponseDto {
  id: string
  subjectName: string
  title: string
  notesBy: string
  notesUrl: string
  position: number
  locked: boolean
  notesType: string
  batchId: number
  isActive: boolean
  notesCode: string
}

export interface NotesFilters {
  pageNo?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
  active?: boolean
  batchId?: number
  subjectName?: string
  notesType?: string
}

export interface NotesPaginatedResponse extends PaginatedResponse<NotesResponseDto> {}

export interface UploadNotesPayload {
  file: File
  batchId: number
}

export interface DuplicateNotesRequest {
  selectedNotes: SelectedNote[]
  targetBatchIds: number[]
}

export interface SelectedNote {
  batchId: number
  notesCode: string
}

export interface UploadResponse {
  code: string | null
  message: string
  uploadedNotes?: string
  mappedNotes?: string
  failedNotes?: string
  errorDetails?: string
  success: boolean
}

// ============================================================================
// NOTES APIs
// ============================================================================

/**
 * Fetch paginated list of notes
 * GET /secure/notes/api/v1/paginated
 */
export const fetchNotes = async (
  filters: NotesFilters = {}
): Promise<NotesPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'position',
    sortDir: filters.sortDir ?? 'ASC',
    active: String(filters.active ?? true),
  }

  if (filters.batchId) params.batchId = String(filters.batchId)
  if (filters.subjectName) params.subjectName = filters.subjectName
  if (filters.notesType) params.notesType = filters.notesType

  console.log('[fetchNotes] Request params:', params)

  try {
    const response = await apiClient<NotesPaginatedResponse>(
      '/secure/notes/api/v1/paginated',
      { params }
    )

    console.log('[fetchNotes] Raw response:', response)

    // Handle the response directly as it matches the expected structure
    if (response && typeof response === 'object') {
      // If response has a data wrapper, unwrap it
      if ('data' in response && response.data) {
        const unwrapped = response.data as NotesPaginatedResponse
        console.log('[fetchNotes] Unwrapped response:', unwrapped)
        return unwrapped
      }
      
      // If response is already in the correct format
      if ('content' in response && Array.isArray(response.content)) {
        console.log('[fetchNotes] Direct response:', response)
        return response as NotesPaginatedResponse
      }
    }

    console.warn('[fetchNotes] Unexpected response structure:', response)
    
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
    console.error('[fetchNotes] Error:', error)
    throw error
  }
}

/**
 * Upload notes file
 * POST /secure/notes/api/v1/upload?batchId={batchId}
 */
export const uploadNotes = async (payload: UploadNotesPayload): Promise<any> => {
  console.log('[uploadNotes] Starting upload with payload:', {
    fileName: payload.file.name,
    fileSize: payload.file.size,
    batchId: payload.batchId,
  })

  const formData = new FormData()
  formData.append('file', payload.file)

  // Build URL with query parameters
  const params = new URLSearchParams()
  params.append('batchId', String(payload.batchId))

  const url = `/secure/notes/api/v1/upload?${params.toString()}`

  const headers: HeadersInit = {}
  
  // Add token as header for authenticated requests
  if (accessToken.value) {
    headers['avToken'] = accessToken.value
  }

  console.log('[uploadNotes] Request URL:', url)
  console.log('[uploadNotes] Request headers:', headers)

  try {
    const response = await fetch(`/api${url}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    })

    console.log('[uploadNotes] Response status:', response.status)
    console.log('[uploadNotes] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const error = await response.text()
      console.error('[uploadNotes] Error response:', error)
      throw new Error(error || 'Upload failed')
    }

    // Try to parse as JSON first, fallback to text
    const contentType = response.headers.get('content-type')
    console.log('[uploadNotes] Response content-type:', contentType)

    let result: any

    try {
      // First try to parse as JSON
      const responseText = await response.text()
      console.log('[uploadNotes] Raw response text:', responseText)

      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        // Looks like JSON
        result = JSON.parse(responseText)
        console.log('[uploadNotes] Parsed JSON response:', result)
      } else {
        // Plain text response - create a success object
        result = {
          success: true,
          message: responseText.trim(),
          error: false,
        }
        console.log('[uploadNotes] Created success response from text:', result)
      }
    } catch (parseError) {
      console.warn('[uploadNotes] Failed to parse JSON, treating as text response:', parseError)
      // If JSON parsing fails, treat the response as plain text success
      const responseText = await response.text()
      result = {
        success: true,
        message: responseText || 'Notes uploaded successfully',
        error: false,
      }
    }

    console.log('[uploadNotes] Final result:', result)
    return result
  } catch (error) {
    console.error('[uploadNotes] Upload error:', error)
    throw error
  }
}

/**
 * Duplicate notes to multiple batches
 * POST /secure/notes/api/v1/duplicate
 */
export const duplicateNotes = async (payload: DuplicateNotesRequest): Promise<UploadResponse> => {
  console.log('[duplicateNotes] Starting duplication with payload:', payload)

  try {
    const response = await apiClient<UploadResponse>(
      '/secure/notes/api/v1/duplicate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    )

    console.log('[duplicateNotes] Response:', response)
    return response
  } catch (error) {
    console.error('[duplicateNotes] Error:', error)
    throw error
  }
}

/**
 * Fetch all batches for dropdown selection
 * This reuses the batches API from chapters service
 */
export const fetchAllBatchesForNotes = async (params?: {
  activeFlag?: boolean
}): Promise<any[]> => {
  const queryParams: Record<string, string> = {}
  
  if (params?.activeFlag !== undefined) {
    queryParams.activeFlag = String(params.activeFlag)
  }

  console.log('[fetchAllBatchesForNotes] Request params:', queryParams)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/batch',
      { params: queryParams }
    )

    console.log('[fetchAllBatchesForNotes] Raw response:', response)

    let batchData = []
    
    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        batchData = Array.isArray(response.data.content) ? response.data.content : 
                   Array.isArray(response.data) ? response.data : []
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
      active: batch.isActive, // for compatibility
    }))

    console.log('[fetchAllBatchesForNotes] Mapped batches:', mappedBatches)
    return mappedBatches
  } catch (error) {
    console.error('[fetchAllBatchesForNotes] Error:', error)
    throw error
  }
}