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
  accessType?: string
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

export interface NotesPaginatedResponse {
  content: NotesResponseDto[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

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

export interface BatchOption {
  id: number
  name: string
  code?: string
  displayName?: string
  language?: string
  examName?: string
  gradeName?: string
  streamName?: string
  isActive?: boolean
  active?: boolean
}

// Update notes request (PATCH)
export interface NotesUpdateRequest {
  subjectName?: string
  title?: string
  notesBy?: string
  notesUrl?: string
  position?: number
  locked?: boolean
  notesType?: string
  isActive?: boolean
}