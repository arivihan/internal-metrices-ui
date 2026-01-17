export interface FileUploadResult {
    id: string
    originalFileName: string
    storedFileName: string
    fileSize: number
    contentType: string
    s3Url: string
    cdnUrl: string
    success: boolean
    errorMessage: string | null
}

export interface UploadResponse {
    totalFiles: number
    successCount: number
    failureCount: number
    uploadType: string
    folderPath: string
    results: FileUploadResult[]
}

export interface FileUploadRecord {
    id: string
    originalFileName: string
    fileName: string
    fileSize: number
    contentType: string
    uploadType: string
    folderPath: string
    s3Url: string
    cdnUrl: string
    uploadedBy: string
    createdAt: string
}

export interface ListResponse {
    records: FileUploadRecord[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
}

export type UploadType = 'chapter' | 'notes' | 'carousel' | 'routine' | 'general'
