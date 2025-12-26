export interface Role {
  id: string
  name: string
  description: string
  createdAt?: string
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
