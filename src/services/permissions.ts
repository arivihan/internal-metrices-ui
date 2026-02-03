import { apiClient, postData, putData, deleteData } from './apiClient'
import type { PermissionListResponse, CreatePermissionPayload, CreatePermissionResponse, UpdatePermissionPayload, UpdatePermissionResponse, DeletePermissionResponse } from '@/types/rbac'

export interface PermissionFilters {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'ASC' | 'DESC'
}

/**
 * Fetch paginated list of permissions
 */
export const fetchPermissions = async (
  filters: PermissionFilters = {}
): Promise<PermissionListResponse> => {
  const params: Record<string, string> = {
    page: (filters.page ?? 0).toString(),
    size: (filters.size ?? 10).toString(),
    sortBy: filters.sortBy ?? 'createdAt',
    sortDir: filters.sortDir ?? 'DESC',
  }

  return apiClient<PermissionListResponse>(
    '/secure/permissions',
    { params }
  )
}

/**
 * Create a new permission
 */
export const createPermission = async (
  payload: CreatePermissionPayload
): Promise<CreatePermissionResponse> => {
  return postData<CreatePermissionResponse>('/secure/permissions', payload)
}

/**
 * Update an existing permission
 */
export const updatePermission = async (
  permissionId: number,
  payload: UpdatePermissionPayload
): Promise<UpdatePermissionResponse> => {
  return putData<UpdatePermissionResponse>(`/secure/permissions/${permissionId}`, payload)
}

/**
 * Delete a permission
 */
export const deletePermission = async (
  permissionId: number
): Promise<DeletePermissionResponse> => {
  return deleteData<DeletePermissionResponse>(`/secure/permissions/${permissionId}`)
}
