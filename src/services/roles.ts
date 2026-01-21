import { apiClient, postData } from './apiClient'
import type { Role, RoleListResponse, RoleDetailResponse, RoleDetail } from '@/types/rbac'

export interface RoleFilters {
  page?: number
  size?: number
}

export interface CreateRolePayload {
  roleName: string
  externalRole: boolean
  permissionIds: number[]
}

export interface CreateRoleResponse {
  success: boolean
  message: string
  data: Role
}

export interface RolePermissionsPayload {
  permissionIds: number[]
}

export interface RolePermissionsResponse {
  message: string
  code: number
  data: RoleDetail
  success: boolean
}

/**
 * Fetch paginated list of roles
 */
export const fetchRoles = async (
  filters: RoleFilters = {}
): Promise<RoleListResponse> => {
  const params: Record<string, string> = {
    page: (filters.page ?? 0).toString(),
    size: (filters.size ?? 10).toString(),
  }

  return apiClient<RoleListResponse>(
    '/secure/roles',
    { params }
  )
}

/**
 * Fetch role details by ID
 */
export const fetchRoleById = async (roleId: string): Promise<RoleDetailResponse> => {
  return apiClient<RoleDetailResponse>(`/secure/roles/${roleId}`)
}

/**
 * Create a new role
 */
export const createRole = async (
  payload: CreateRolePayload
): Promise<CreateRoleResponse> => {
  return postData<CreateRoleResponse>('/secure/roles', payload)
}

/**
 * Add permissions to a role
 */
export const addPermissionsToRole = async (
  roleId: string,
  payload: RolePermissionsPayload
): Promise<RolePermissionsResponse> => {
  return postData<RolePermissionsResponse>(`/secure/roles/${roleId}/permissions`, payload)
}

/**
 * Remove permissions from a role
 */
export const removePermissionsFromRole = async (
  roleId: string,
  payload: RolePermissionsPayload
): Promise<RolePermissionsResponse> => {
  return apiClient<RolePermissionsResponse>(`/secure/roles/${roleId}/permissions`, {
    method: 'DELETE',
    body: JSON.stringify(payload),
  })
}
