import { apiClient } from './apiClient'
import type { UploadResponse, ListResponse } from '../types/upload'
import { API_CONFIG } from '../config'

// removing top-level BASE_URL to use API_CONFIG inside functions

import { accessToken } from '@/signals/auth'

export const uploadFiles = async (
    files: File[],
    uploadType: string = 'general',
    folderPath?: string
): Promise<UploadResponse> => {
    const formData = new FormData()
    files.forEach((file) => {
        formData.append('files', file)
    })

    // Clean params before appending
    if (uploadType) formData.append('uploadType', uploadType)
    if (folderPath && folderPath.trim()) formData.append('folderPath', folderPath.trim())

    const url = `${API_CONFIG.UPLOAD_BASE}/files`

    console.log('[uploadService] 🔧 API_CONFIG:', API_CONFIG)
    console.log('[uploadService] 📤 Uploading to URL:', url)
    console.log('[uploadService] 🔗 Full URL:', url)

    const headers: Record<string, string> = {}
    if (accessToken.value) {
        headers['avToken'] = accessToken.value
    }

    const response = await fetch(url, {
        method: 'POST',
        headers, // No Content-Type header to allow FormData boundary
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(error.message || 'Upload failed')
    }

    const data = await response.json()
    // Handle wrapped response if necessary, similar to list endpoint
    return data.data || data;
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
