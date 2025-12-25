import { apiClient, postData } from './apiClient'
import type {
  Chapter,
  ChapterFilters,
  ChapterPaginatedResponse,
  ChapterFilterOptions,
  AddChapterPayload,
  MapChapterPayload,
  FilterOption,
} from '@/types/chapters'

// API response wrapper
interface ApiResponse<T> {
  code: number
  message: string
  success: boolean
  data: T
}

/**
 * Fetch paginated list of chapters
 */
export const fetchChapters = async (
  filters: ChapterFilters = {}
): Promise<ChapterPaginatedResponse> => {
  const params: Record<string, string> = {
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 10),
  }

  if (filters.courseId) params.courseId = filters.courseId
  if (filters.subjectId) params.subjectId = filters.subjectId
  if (filters.chapterId) params.chapterId = filters.chapterId
  if (filters.language) params.language = filters.language

  // TODO: Update endpoint when backend is ready
  const response = await apiClient<ApiResponse<ChapterPaginatedResponse>>(
    '/secure/chapters',
    { params }
  )

  return response.data
}

/**
 * Fetch filter options for dropdowns
 */
export const fetchChapterFilterOptions = async (): Promise<ChapterFilterOptions> => {
  // TODO: Update endpoint when backend is ready
  const response = await apiClient<ApiResponse<ChapterFilterOptions>>(
    '/secure/chapters/filters'
  )

  return response.data
}

/**
 * Fetch courses for filter dropdown
 */
export const fetchCourses = async (): Promise<FilterOption[]> => {
  const response = await apiClient<ApiResponse<FilterOption[]>>(
    '/secure/dashboard/courses'
  )
  return response.data
}

/**
 * Fetch subjects for filter dropdown
 */
export const fetchSubjects = async (): Promise<FilterOption[]> => {
  const response = await apiClient<ApiResponse<FilterOption[]>>(
    '/secure/dashboard/subjects'
  )
  return response.data
}

/**
 * Fetch exams/boards for filter dropdown
 */
export const fetchExams = async (): Promise<FilterOption[]> => {
  const response = await apiClient<ApiResponse<FilterOption[]>>(
    '/secure/dashboard/boards'
  )
  return response.data
}

/**
 * Add a new chapter
 */
export const addChapter = async (
  payload: AddChapterPayload
): Promise<Chapter> => {
  // TODO: Update endpoint when backend is ready
  // Note: If video upload is needed, this will need to use FormData instead
  const response = await postData<ApiResponse<Chapter>>(
    '/secure/chapters',
    payload
  )

  return response.data
}

/**
 * Map an existing chapter to courses/exams/subjects
 */
export const mapChapter = async (
  payload: MapChapterPayload
): Promise<Chapter> => {
  // TODO: Update endpoint when backend is ready
  const response = await postData<ApiResponse<Chapter>>(
    `/secure/chapters/${payload.chapterId}/map`,
    payload
  )

  return response.data
}
