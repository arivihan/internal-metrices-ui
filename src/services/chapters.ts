import { apiClient } from './apiClient'
import type {
  ChapterFilters,
  ChapterPaginatedResponse,
  AddChapterPayload,
  MapChapterPayload,
  FilterOption,
  UploadResponse,
  ChapterMappingResultDto,
} from '@/types/chapters'
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

const BASE_URL = '/api'

// ============================================================================
// CHAPTER APIs
// ============================================================================

/**
 * Fetch paginated list of chapters
 * GET /secure/api/v1/batch-chapters
 */
export const fetchChapters = async (
  filters: ChapterFilters = {}
): Promise<ChapterPaginatedResponse> => {
  const params: Record<string, string> = {
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 20),
  }

  if (filters.subjectId) params.subjectId = filters.subjectId
  if (filters.active !== undefined) params.active = String(filters.active)
  if (filters.availableInEnglish !== undefined) params.availableInEnglish = String(filters.availableInEnglish)
  if (filters.accessType) params.accessType = filters.accessType
  if (filters.chapterType) params.chapterType = filters.chapterType
  if (filters.chapterStatus) params.chapterStatus = filters.chapterStatus
  if (filters.newLecture !== undefined) params.newLecture = String(filters.newLecture)
  if (filters.search) params.search = filters.search
  if (filters.gradeId) params.gradeId = String(filters.gradeId)
  if (filters.batchLanguage) params.batchLanguage = filters.batchLanguage
  if (filters.batchId) params.batchId = String(filters.batchId)
  if (filters.streamId) params.streamId = String(filters.streamId)
  if (filters.examCode) params.examCode = filters.examCode
  if (filters.gradeCode) params.gradeCode = filters.gradeCode
  if (filters.streamCode) params.streamCode = filters.streamCode
  if (filters.subjectCode) params.subjectCode = filters.subjectCode
  if (filters.batchCode) params.batchCode = filters.batchCode
  if (filters.batchAddOnCode) params.batchAddOnCode = filters.batchAddOnCode
  if (filters.sort) params.sort = filters.sort

  console.log('[fetchChapters] Request params:', params)

  try {
    const response = await apiClient<ChapterPaginatedResponse>(
      '/secure/api/v1/batch-chapters',
      { params }
    )

    console.log('[fetchChapters] Response:', response)

    if (response && typeof response === 'object') {
      if ('data' in response && response.data) {
        return response.data as ChapterPaginatedResponse
      }
      return response
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: filters.size ?? 20,
      number: filters.page ?? 0,
      pageNumber: filters.page ?? 0,
      pageSize: filters.size ?? 20,
      last: true,
    }
  } catch (error) {
    console.error('[fetchChapters] Error:', error)
    throw error
  }
}

/**
 * Upload chapter with exam, grade, stream, batch and batch-addon
 * POST /secure/api/v1/chapter/upload
 */
export const uploadChapter = async (
  payload: AddChapterPayload
): Promise<UploadResponse> => {
  console.log('[uploadChapter] Starting upload with payload:', {
    fileName: payload.file.name,
    fileSize: payload.file.size,
    fileType: payload.file.type,
    examId: payload.examId,
    gradeId: payload.gradeId,
    streamId: payload.streamId,
    batchId: payload.batchId,
    batchAddOnId: payload.batchAddOnId,
    language: payload.language
  })

  const formData = new FormData()
  
  // Handle different file types appropriately
  const fileName = payload.file.name
  const fileType = payload.file.type
  const isCSV = fileName.toLowerCase().endsWith('.csv')
  const isOLE2 = fileName.toLowerCase().endsWith('.xls') || 
                fileName.toLowerCase().endsWith('.doc') ||
                fileType.includes('ms-excel') ||
                fileType === 'application/octet-stream'
  
  // Explicitly set filename and ensure proper content type handling
  formData.append('file', payload.file, fileName)
  
  console.log('[uploadChapter] File type detection:', {
    fileName,
    fileType,
    isCSV,
    isOLE2,
    fileExtension: fileName.split('.').pop()?.toLowerCase()
  })

  const queryParams: string[] = []
  if (payload.examId) queryParams.push(`examId=${payload.examId}`)
  if (payload.gradeId) queryParams.push(`gradeId=${payload.gradeId}`)
  if (payload.streamId) queryParams.push(`streamId=${payload.streamId}`)
  if (payload.batchId) queryParams.push(`batchId=${payload.batchId}`)
  if (payload.batchAddOnId) queryParams.push(`batchAddOnId=${payload.batchAddOnId}`)
  if (payload.language) queryParams.push(`language=${payload.language}`)

  const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
  const url = `${BASE_URL}/secure/api/v1/chapter/upload${queryString}`
  
  console.log('[uploadChapter] Request URL:', url)

  const headers: HeadersInit = {
    // Don't set Content-Type for FormData, let browser set it with boundary
  }
  if (accessToken.value) {
    headers['avToken'] = accessToken.value
  }

  console.log('[uploadChapter] Request headers:', headers)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  })

  console.log('[uploadChapter] Response status:', response.status)
  console.log('[uploadChapter] Response headers:', Object.fromEntries(response.headers.entries()))

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    console.error('[uploadChapter] Error response:', error)
    throw new Error(error.message || 'Upload failed')
  }

  const result = await response.json()
  console.log('[uploadChapter] Success response:', result)
  return result
}

/**
 * Save/Confirm chapter upload after preview
 * POST /secure/api/v1/chapter/save
 */
export const saveChapterUpload = async (
  uploadData: any
): Promise<UploadResponse> => {
  console.log('[saveChapterUpload] Saving upload data:', uploadData)

  const url = `${BASE_URL}/secure/api/v1/chapter/save`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (accessToken.value) {
    headers['avToken'] = accessToken.value
  }

  console.log('[saveChapterUpload] Request URL:', url)
  console.log('[saveChapterUpload] Request headers:', headers)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(uploadData),
    credentials: 'include',
  })

  console.log('[saveChapterUpload] Response status:', response.status)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Save failed' }))
    console.error('[saveChapterUpload] Error response:', error)
    throw new Error(error.message || 'Save failed')
  }

  const result = await response.json()
  console.log('[saveChapterUpload] Success response:', result)
  return result
}

/**
 * Map chapters to batch and batch add-on
 * POST /secure/api/v1/chapter-mappings
 */
export const mapChapters = async (
  payload: MapChapterPayload
): Promise<ApiResponse<ChapterMappingResultDto[]>> => {
  const url = `${BASE_URL}/secure/api/v1/chapter-mappings`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (accessToken.value) {
    headers['avToken'] = accessToken.value
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload.chapters),
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Mapping failed' }))
    throw new Error(error.message || 'Mapping failed')
  }

  return response.json()
}

// ============================================================================
// EXAM APIs
// ============================================================================

/**
 * Fetch all exams
 * GET /secure/api/v1/exam
 */
export const fetchExams = async (params?: {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: string
  active?: boolean
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    pageNo: String(params?.pageNo ?? 0),
    pageSize: String(params?.pageSize ?? 100),
  }

  if (params?.search) queryParams.search = params.search
  if (params?.sortBy) queryParams.sortBy = params.sortBy
  if (params?.sortDir) queryParams.sortDir = params.sortDir
  if (params?.active !== undefined) queryParams.active = String(params.active)

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/exam',
    { params: queryParams }
  )

  return {
    content: response.content.map((exam: any) => ({
      id: exam.id,
      name: exam.displayName || exam.code,
      code: exam.code,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// EXAM-GRADE MAPPING APIs (Grades linked to Exam)
// ============================================================================

/**
 * Fetch grades linked to an exam
 * GET /secure/api/v1/exam-grades?examId={examId}
 */
export const fetchGradesByExam = async (params: {
  examId: number
  pageNo?: number
  pageSize?: number
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    examId: String(params.examId),
    pageNo: String(params.pageNo ?? 0),
    pageSize: String(params.pageSize ?? 100),
  }

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/exam-grades',
    { params: queryParams }
  )

  return {
    content: response.content.map((item: any) => ({
      id: item.gradeId,
      name: item.gradeName || item.gradeCode,
      code: item.gradeCode,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// EXAM-GRADE-STREAM MAPPING APIs (Streams linked to Exam+Grade)
// ============================================================================

/**
 * Fetch streams linked to an exam and grade
 * GET /secure/api/v1/exam-grade-streams?examId={examId}&gradeId={gradeId}
 */
export const fetchStreamsByExamGrade = async (params: {
  examId: number
  gradeId: number
  pageNo?: number
  pageSize?: number
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    examId: String(params.examId),
    gradeId: String(params.gradeId),
    page: String(params.pageNo ?? 0),
    size: String(params.pageSize ?? 100),
  }

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/exam-grade-streams',
    { params: queryParams }
  )

  return {
    content: response.content.map((item: any) => ({
      id: item.streamId,
      name: item.streamName || item.streamCode,
      code: item.streamCode,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// BATCH APIs
// ============================================================================

/**
 * Fetch batches filtered by exam, grade, stream
 * GET /secure/api/v1/batch?examId={examId}&gradeId={gradeId}&streamId={streamId}
 */
export const fetchBatches = async (params?: {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: string
  activeFlag?: boolean
  examId?: number
  gradeId?: number
  streamId?: number
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    pageNo: String(params?.pageNo ?? 0),
    pageSize: String(params?.pageSize ?? 100),
  }

  if (params?.search) queryParams.search = params.search
  if (params?.sortBy) queryParams.sortBy = params.sortBy
  if (params?.sortDir) queryParams.sortDir = params.sortDir
  if (params?.activeFlag !== undefined) queryParams.activeFlag = String(params.activeFlag)
  if (params?.examId) queryParams.examId = String(params.examId)
  if (params?.gradeId) queryParams.gradeId = String(params.gradeId)
  if (params?.streamId) queryParams.streamId = String(params.streamId)

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/batch',
    { params: queryParams }
  )

  return {
    content: response.content.map((batch: any) => ({
      id: batch.id,
      name: batch.displayName || batch.code,
      code: batch.code,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// BATCH ADD-ON APIs
// ============================================================================

/**
 * Fetch batch add-ons filtered by batch
 * GET /secure/api/v1/batch-addon?batchId={batchId}
 */
export const fetchBatchAddOns = async (params?: {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: string
  batchId?: number
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    pageNo: String(params?.pageNo ?? 0),
    pageSize: String(params?.pageSize ?? 100),
  }

  if (params?.search) queryParams.search = params.search
  if (params?.sortBy) queryParams.sortBy = params.sortBy
  if (params?.sortDir) queryParams.sortDir = params.sortDir
  if (params?.batchId) queryParams.batchId = String(params.batchId)

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/batch-addon',
    { params: queryParams }
  )

  return {
    content: response.content.map((addon: any) => ({
      id: addon.id,
      name: addon.name || addon.code,
      code: addon.code,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// SUBJECT APIs
// ============================================================================

/**
 * Fetch all subjects
 * GET /secure/api/v1/subject
 */
export const fetchSubjects = async (params?: {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: string
  active?: boolean
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    pageNo: String(params?.pageNo ?? 0),
    pageSize: String(params?.pageSize ?? 100),
  }

  if (params?.search) queryParams.search = params.search
  if (params?.sortBy) queryParams.sortBy = params.sortBy
  if (params?.sortDir) queryParams.sortDir = params.sortDir
  if (params?.active !== undefined) queryParams.active = String(params.active)

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/subject',
    { params: queryParams }
  )

  return {
    content: response.content.map((subject: any) => ({
      id: subject.id,
      name: subject.displayName || subject.name || subject.code,
      code: subject.code,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// LANGUAGE APIs
// ============================================================================

/**
 * Fetch supported languages
 * GET /secure/api/v1/languages/supported
 */
export const fetchLanguages = async (): Promise<FilterOption[]> => {
  const response = await apiClient<ApiResponse<any[]>>(
    '/secure/api/v1/languages/supported'
  )

  return response.data.map((lang: any) => ({
    id: lang.code,
    name: lang.displayNameEn,
    code: lang.code,
  }))
}

// ============================================================================
// GRADE APIs (Direct - not linked to exam)
// ============================================================================

/**
 * Fetch all grades (direct, not linked to exam)
 * GET /secure/api/v1/grade
 */
export const fetchGrades = async (params?: {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: string
  active?: boolean
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    pageNo: String(params?.pageNo ?? 0),
    pageSize: String(params?.pageSize ?? 100),
  }

  if (params?.search) queryParams.search = params.search
  if (params?.sortBy) queryParams.sortBy = params.sortBy
  if (params?.sortDir) queryParams.sortDir = params.sortDir
  if (params?.active !== undefined) queryParams.active = String(params.active)

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/grade',
    { params: queryParams }
  )

  return {
    content: response.content.map((grade: any) => ({
      id: grade.id,
      name: grade.displayName || grade.code,
      code: grade.code,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// STREAM APIs (Direct - not linked to exam-grade)
// ============================================================================

/**
 * Fetch all streams (direct, not linked to exam-grade)
 * GET /secure/api/v1/stream
 */
export const fetchStreams = async (params?: {
  pageNo?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: string
  active?: boolean
}): Promise<{ content: FilterOption[], totalPages: number, totalElements: number }> => {
  const queryParams: Record<string, string> = {
    pageNo: String(params?.pageNo ?? 0),
    pageSize: String(params?.pageSize ?? 100),
  }

  if (params?.search) queryParams.search = params.search
  if (params?.sortBy) queryParams.sortBy = params.sortBy
  if (params?.sortDir) queryParams.sortDir = params.sortDir
  if (params?.active !== undefined) queryParams.active = String(params.active)

  const response = await apiClient<PaginatedResponse<any>>(
    '/secure/api/v1/stream',
    { params: queryParams }
  )

  return {
    content: response.content.map((stream: any) => ({
      id: stream.id,
      name: stream.name || stream.code,
      code: stream.code,
    })),
    totalPages: response.totalPages,
    totalElements: response.totalElements,
  }
}

// ============================================================================
// MAPPING APIs (For getting all mappings upfront)
// ============================================================================

/**
 * Fetch all exam-grade mappings
 * GET /secure/api/v1/exam-grades/all
 */
export const fetchExamGradeMappings = async (): Promise<Array<{examId: number, gradeId: number}>> => {
  try {
    const response = await apiClient<PaginatedResponse<any>>(
      '/secure/api/v1/exam-grades',
      { params: { pageNo: '0', pageSize: '100' } }
    )

    return response.content.map((item: any) => ({
      examId: item.examId,
      gradeId: item.gradeId,
    }))
  } catch (error) {
    console.error('Error fetching exam-grade mappings:', error)
    return []
  }
}

/**
 * Fetch all exam-grade-stream mappings
 * GET /secure/api/v1/exam-grade-streams/all
 */
export const fetchExamGradeStreamMappings = async (): Promise<Array<{examId: number, gradeId: number, streamId: number}>> => {
  try {
    const response = await apiClient<PaginatedResponse<any>>(
      '/secure/api/v1/exam-grade-streams',
      { params: { page: '0', size: '100' } }
    )

    return response.content.map((item: any) => ({
      examId: item.examId,
      gradeId: item.gradeId,
      streamId: item.streamId,
    }))
  } catch (error) {
    console.error('Error fetching exam-grade-stream mappings:', error)
    return []
  }
}

/**
 * Fetch all batches with their exam, grade, stream associations
 * GET /secure/api/v1/batch/all-with-mappings
 */
export const fetchAllBatches = async (params?: {
  activeFlag?: boolean
}): Promise<FilterOption[]> => {
  try {
    const queryParams: Record<string, string> = {
      pageNo: '0',
      pageSize: '100',
    }

    if (params?.activeFlag !== undefined) queryParams.activeFlag = String(params.activeFlag)

    const response = await apiClient<PaginatedResponse<any>>(
      '/secure/api/v1/batch',
      { params: queryParams }
    )

    return response.content.map((batch: any) => ({
      id: batch.id,
      name: batch.displayName || batch.code,
      code: batch.code,
      examId: batch.examId,
      gradeId: batch.gradeId,
      streamId: batch.streamId,
    }))
  } catch (error) {
    console.error('Error fetching all batches:', error)
    return []
  }
}

/**
 * Fetch all batch add-ons with their batch associations
 * GET /secure/api/v1/batch-addon/all
 */
export const fetchAllBatchAddOns = async (): Promise<FilterOption[]> => {
  try {
    const response = await apiClient<PaginatedResponse<any>>(
      '/secure/api/v1/batch-addon',
      { params: { pageNo: '0', pageSize: '100' } }
    )

    return response.content.map((addon: any) => ({
      id: addon.id,
      name: addon.name || addon.code,
      code: addon.code,
      batchId: addon.batchId,
    }))
  } catch (error) {
    console.error('Error fetching all batch add-ons:', error)
    return []
  }
}
