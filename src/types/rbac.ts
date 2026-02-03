export interface Role {
  roleId: string
  roleName: string
  externalRole: boolean
  description?: string
  createdAt?: string
}

export interface RoleListResponse {
  content: Role[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  entityName: string
}

export interface RolePermission {
  id: number
  name: string
  module: string
  httpMethod: string
  apiPattern: string
}

export interface RoleDetail {
  roleId: string
  roleName: string
  externalRole: boolean
  permissions: RolePermission[]
}

export interface RoleDetailResponse {
  message: string
  code: number
  data: RoleDetail
  success: boolean
}

export interface PermissionListResponse {
  content: RolePermission[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
  entityName: string | null
}

export interface CreatePermissionPayload {
  name: string
  module: string
  httpMethod: string
  apiPattern: string
}

export interface CreatePermissionResponse {
  message: string
  code: number
  data: RolePermission
  success: boolean
}

export interface UpdatePermissionPayload {
  name: string
  module: string
  httpMethod: string
  apiPattern: string
}

export interface UpdatePermissionResponse {
  message: string
  code: number
  data: RolePermission
  success: boolean
}

export interface DeletePermissionResponse {
  message: string
  code: number
  success: boolean
}

export interface Module {
  id: string
  name: string
  description: string
}

export interface Permission {
  moduleId: string
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

export interface RolePermissions {
  roleId: string
  permissions: Permission[]
}
