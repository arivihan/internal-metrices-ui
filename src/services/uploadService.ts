import { apiClient } from './apiClient'
import type { UploadResponse, ListResponse } from '../types/upload'
import { API_CONFIG } from '../config'

// removing top-level BASE_URL to use API_CONFIG inside functions

import { accessToken } from '@/signals/auth'

export const uploadFiles = async (
    files: File[],
    uploadType: string = 'general',
    folderPath?: string,
    onProgress?: (percent: number) => void
): Promise<UploadResponse> => {
    return new Promise((resolve, reject) => {
        const formData = new FormData()
        files.forEach((file) => {
            formData.append('files', file)
        })

        if (uploadType) formData.append('uploadType', uploadType)
        if (folderPath && folderPath.trim()) formData.append('folderPath', folderPath.trim())

        const url = `${API_CONFIG.UPLOAD_BASE}/files`

        console.log('[uploadService] 🔧 API_CONFIG:', API_CONFIG)
        console.log('[uploadService] 📤 Uploading to URL:', url)

        const xhr = new XMLHttpRequest()
        xhr.open('POST', url)

        if (accessToken.value) {
            xhr.setRequestHeader('avToken', accessToken.value)
        }

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percentComplete = Math.round((event.loaded / event.total) * 100)
                onProgress(percentComplete)
            }
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText)
                    resolve(data.data || data)
                } catch (e) {
                    reject(new Error('Failed to parse response'))
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText)
                    reject(new Error(error.message || 'Upload failed'))
                } catch (e) {
                    reject(new Error('Upload failed'))
                }
            }
        }

        xhr.onerror = () => {
            reject(new Error('Network error during upload'))
        }

        xhr.send(formData)
    })
}

export const getFilesList = async (
    page: number = 0,
    size: number = 20,
    search?: string,
    uploadType?: string
): Promise<ListResponse> => {
    const params: Record<string, string> = {
        page: page.toString(),
        size: size.toString(),
    }

    if (search) params.search = search
    if (uploadType && uploadType !== 'all') params.uploadType = uploadType

    // Use absolute URL to bypass apiClient's default /api prefixing
    const url = `${API_CONFIG.UPLOAD_BASE}/files`
    const response = await apiClient<any>(url, {
        params
    })

    // Handle wrapped response
    if (response && response.data) {
        return response.data;
    }
    return response;
}

export const getSupportedExtensions = async (): Promise<string[]> => {
    // Use absolute URL to bypass apiClient's default /api prefixing
    const url = `${API_CONFIG.UPLOAD_BASE}/supported-extensions`
    const response = await apiClient<any>(url)
    return response.data || response || []
}

export const getUploadTypes = async (): Promise<string[]> => {
    // Use absolute URL to bypass apiClient's default /api prefixing
    const url = `${API_CONFIG.UPLOAD_BASE}/upload-types`
    const response = await apiClient<any>(url)
    return response.data || response || []
}
