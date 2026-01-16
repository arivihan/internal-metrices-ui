// Subject interface
export interface Subject {
  id: string
  code: string | null
  name: string
  displayName: string
  pos: number
  color: string
  iconUrl: string
  mainSubject: boolean
  boardsSubject: boolean
  progressEligible: boolean
  isActive: boolean
}

// AssignedBatch interface
export interface AssignedBatch {
  batchId: number
  batchName: string
  isAddOn: boolean
  batchAddOnId?: number
}

// Chapter DTO from API
export interface ChapterDto {
  chapterId: string
  chapterCode: string
  teacherName: string
  teacherNameHindi: string
  chapterInfo: string
  defaultStartTime: number
  subject: Subject
  chapterName: string
  videoImage: string
  title: string
  hindiTitle: string
  subTitle: string
  chapterNameLanguage: string
  active: boolean
  pos: number
  firebaseChapterName: string
  accessType: string
  lockMessage: string
  completed: boolean
  teacherIntro: string
  notesUrl: string
  teacherIntroHindi: string
  notesUrlHindi: string
  microLectureCount: number
  batchChapters: AssignedBatch[]
  lectureCount: number
  fromUi: boolean
  selectedChapter: string
  videoTitle: string
}

// Chapter list item (for display)
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
  id: string | number
  name: string
  code?: string
  // For mapping relationships
  examId?: number
  gradeId?: number
  streamId?: number
  batchId?: number
}

// Filters for fetching chapters
export interface ChapterFilters {
  page?: number
  size?: number
  subjectId?: string
  active?: boolean
  availableInEnglish?: boolean
  accessType?: string
  chapterType?: string
  chapterStatus?: string
  newLecture?: boolean
  search?: string
  gradeId?: number
  batchLanguage?: string
  batchId?: number
  streamId?: number
  examCode?: string
  gradeCode?: string
  streamCode?: string
  subjectCode?: string
  batchCode?: string
  batchAddOnCode?: string
  sort?: string
}

// Paginated response
export interface ChapterPaginatedResponse {
  content: ChapterDto[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  pageNumber: number
  pageSize: number
  last: boolean
}

// Chapter upload response
export interface ExcelChapterUploadDto {
  examId?: number
  gradeId?: number
  streamId?: number
  batchId?: number
  batchAddOnId?: number
  error: boolean
  errors: string[]
  datas: ChapterUploadDto[]
  logs: string
  filePath?: string
  subject?: string
  board?: string
  cqnq: boolean
  language: string
}

export interface ChapterUploadDto {
  chapterId: string
  chapterName: string
  displayOrder: number
  subject: string
  [key: string]: any
}

// Upload response
export interface UploadResponse {
  code: string
  message: string
  uploadedChapters: string
  mappedChapters: string
  failedChapters: string
  errorDetails: string
  success: boolean
}

// Chapter mapping request
export interface ChapterRequestDto {
  chapterId: string
  displayOrder: number
}

// Chapter mapping result
export interface ChapterMappingResultDto {
  chapterId: string
  status: string
  message: string
}

// Payload for adding/updating chapter (file upload)
export interface AddChapterPayload {
  file: File
  examId?: number
  gradeId?: number
  streamId?: number
  batchId?: number
  batchAddOnId?: number
  language?: string
}

// For mapping existing chapters
export interface MapChapterPayload {
  chapters: ChapterRequestDto[]
}
