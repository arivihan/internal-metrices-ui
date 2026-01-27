import { apiClient } from './apiClient'
import { accessToken } from '@/signals/auth'

// Use environment variable or fallback to proxy in development
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

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
  search?: string
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
  if (filters.search) params.search = filters.search

  console.log('[fetchNotes] Request params:', params)

  try {
    const response = await apiClient<NotesPaginatedResponse>(
      '/secure/api/v1/notes',
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

  const url = `/secure/api/v1/notes/upload?${params.toString()}`

  const headers: HeadersInit = {}
  
  // Add token as header for authenticated requests
  if (accessToken.value) {
    headers['avToken'] = accessToken.value
  }

  console.log('[uploadNotes] Request URL:', url)
  console.log('[uploadNotes] Request headers:', headers)

  try {
    const response = await fetch(`${BASE_URL}${url}`, {
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
 * Update a note
 * PATCH /secure/api/v1/notes/{id}
 */
export const updateNote = async (
  id: string,
  data: Partial<{
    code: string
    title: string
    url: string
    accessType: string
    type: string
    position: number
    isActive: boolean
    subject: string
  }>
): Promise<any> => {
  console.log('[updateNote] Updating note:', { id, data })

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/notes/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )

    console.log('[updateNote] Response:', response)
    return response
  } catch (error) {
    console.error('[updateNote] Error:', error)
    throw error
  }
}

// ============================================================================
// AUDIT TRAIL Types
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

// ============================================================================
// AUDIT TRAIL APIs
// ============================================================================

/**
 * Fetch row-wise audit trail for a specific note
 * GET /secure/api/v1/audit-logs/row?entityName=Notes&entityId={id}&pageNo=0&pageSize=10
 */
export const fetchNoteAuditTrail = async (
  noteId: string,
  pageNo: number = 0,
  pageSize: number = 10
): Promise<AuditTrailPaginatedResponse> => {
  console.log('[fetchNoteAuditTrail] Fetching audit trail for note:', noteId)

  try {
    const params: Record<string, string> = {
      entityName: 'NotesEntity',
      entityId: noteId,
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>(
      '/secure/api/v1/audit-logs/row',
      { params }
    )

    console.log('[fetchNoteAuditTrail] Response:', response)

    // Handle different response formats
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
    console.error('[fetchNoteAuditTrail] Error:', error)
    throw error
  }
}

/**
 * Fetch table-wise audit trail for all notes
 * GET /secure/api/v1/audit-logs?entityName=Notes&pageNo=0&pageSize=10
 */
export const fetchNotesTableAuditTrail = async (
  pageNo: number = 0,
  pageSize: number = 10
): Promise<AuditTrailPaginatedResponse> => {
  console.log('[fetchNotesTableAuditTrail] Fetching table audit trail')

  try {
    const params: Record<string, string> = {
      entityName: 'NotesEntity',
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    }

    const response = await apiClient<any>(
      '/secure/api/v1/audit-logs/table',
      { params }
    )

    console.log('[fetchNotesTableAuditTrail] Response:', response)

    // Handle different response formats
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
    console.error('[fetchNotesTableAuditTrail] Error:', error)
    throw error
  }
}

/**
 * Delete a note
 * DELETE /secure/api/v1/notes/{id}
 */
export const deleteNote = async (id: string): Promise<any> => {
  console.log('[deleteNote] Deleting note:', id)

  try {
    const response = await apiClient<any>(
      `/secure/api/v1/notes/${id}`,
      {
        method: 'DELETE',
      }
    )

    console.log('[deleteNote] Response:', response)
    return response
  } catch (error) {
    console.error('[deleteNote] Error:', error)
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
      '/secure/api/v1/notes/duplicate',
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

/**
 * Fetch batches with pagination for dropdown
 * GET /secure/api/v1/batch with pagination params
 */
export interface BatchFilters {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
  activeFlag?: boolean
  examId?: number
  gradeId?: number
  streamId?: number
}

export interface BatchPaginatedResponse {
  content: any[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export const fetchBatchesPaginated = async (
  filters: BatchFilters = {}
): Promise<BatchPaginatedResponse> => {
  const params: Record<string, string> = {
    pageNo: String(filters.pageNo ?? 0),
    pageSize: String(filters.pageSize ?? 10),
    sortBy: filters.sortBy ?? 'displayOrder',
    sortDir: filters.sortDir ?? 'ASC',
  }

  if (filters.search) params.search = filters.search
  if (filters.activeFlag !== undefined) params.activeFlag = String(filters.activeFlag)
  if (filters.examId) params.examId = String(filters.examId)
  if (filters.gradeId) params.gradeId = String(filters.gradeId)
  if (filters.streamId) params.streamId = String(filters.streamId)

  console.log('[fetchBatchesPaginated] Request params:', params)

  try {
    const response = await apiClient<any>(
      '/secure/api/v1/batch',
      { params }
    )

    console.log('[fetchBatchesPaginated] Response:', response)

    // Handle different response formats
    let result: BatchPaginatedResponse = {
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

    // Map batches to include display name
    result.content = result.content.map((batch: any) => ({
      id: batch.id,
      name: batch.displayName || batch.name || batch.code || `Batch ${batch.id}`,
      code: batch.code,
      displayName: batch.displayName,
      language: batch.language,
      examName: batch.examName,
      gradeName: batch.gradeName,
      streamName: batch.streamName,
      isActive: batch.isActive,
    }))

    return result
  } catch (error) {
    console.error('[fetchBatchesPaginated] Error:', error)
    throw error
  }
}