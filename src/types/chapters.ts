// Chapter list item
export interface Chapter {
  id: string
  chapterName: string
  subject: string
  subjectId: string
  language: 'Hindi' | 'English'
  isMapped: boolean
  courseIds?: string[]
  examIds?: string[]
}

// Filter options for dropdowns
export interface ChapterFilterOptions {
  courses: FilterOption[]
  subjects: FilterOption[]
  chapters: FilterOption[]
  languages: FilterOption[]
  exams: FilterOption[]
}

export interface FilterOption {
  id: string
  name: string
}

// Filters for fetching chapters
export interface ChapterFilters {
  page?: number
  size?: number
  courseId?: string
  subjectId?: string
  chapterId?: string
  language?: string
}

// Paginated response
export interface ChapterPaginatedResponse {
  content: Chapter[]
  totalElements: number
  totalPages: number
  size: number
  number: number // current page (0-indexed)
}

// Payload for adding/updating chapter
export interface AddChapterPayload {
  chapterName: string
  examIds: string[]
  courseIds: string[]
  subjectIds: string[]
  language: 'Hindi' | 'English'
  videoFile?: File
}

// For editing/mapping existing chapter
export interface MapChapterPayload {
  chapterId: string
  examIds: string[]
  courseIds: string[]
  subjectIds: string[]
  language: 'Hindi' | 'English'
}
