import { useState } from 'react'
import { Plus, Shield, Box, Pencil, Trash2, Key } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { AddRoleDialog } from './AddRoleDialog'
import { AddModuleDialog } from './AddModuleDialog'
import { PermissionsMatrixDialog } from './PermissionsMatrixDialog'

import type { Role, Module, Permission, RolePermissions } from '@/types/rbac'

// Placeholder data - replace with API calls when backend is ready
const PLACEHOLDER_ROLES: Role[] = [
  { id: '1', name: 'Admin', description: 'Full access to all modules', createdAt: '2024-01-15' },
  { id: '2', name: 'Manager', description: 'Can manage content and users', createdAt: '2024-02-10' },
  { id: '3', name: 'Viewer', description: 'Read-only access', createdAt: '2024-03-05' },
]

const PLACEHOLDER_MODULES: Module[] = [
  { id: '1', name: 'Users', description: 'User management' },
  { id: '2', name: 'Chapters', description: 'Chapter content management' },
  { id: '3', name: 'Notifications', description: 'Notification system' },
  { id: '4', name: 'Reports', description: 'Analytics and reports' },
  { id: '5', name: 'Settings', description: 'Application settings' },
]

const PLACEHOLDER_PERMISSIONS: RolePermissions[] = [
  {
    roleId: '1',
    permissions: [
      { moduleId: '1', create: true, read: true, update: true, delete: true },
      { moduleId: '2', create: true, read: true, update: true, delete: true },
      { moduleId: '3', create: true, read: true, update: true, delete: true },
      { moduleId: '4', create: true, read: true, update: true, delete: true },
      { moduleId: '5', create: true, read: true, update: true, delete: true },
    ],
  },
  {
    roleId: '2',
    permissions: [
      { moduleId: '1', create: true, read: true, update: true, delete: false },
      { moduleId: '2', create: true, read: true, update: true, delete: false },
      { moduleId: '3', create: true, read: true, update: false, delete: false },
      { moduleId: '4', create: false, read: true, update: false, delete: false },
      { moduleId: '5', create: false, read: true, update: false, delete: false },
    ],
  },
  {
    roleId: '3',
    permissions: [
      { moduleId: '1', create: false, read: true, update: false, delete: false },
      { moduleId: '2', create: false, read: true, update: false, delete: false },
      { moduleId: '3', create: false, read: true, update: false, delete: false },
      { moduleId: '4', create: false, read: true, update: false, delete: false },
      { moduleId: '5', create: false, read: true, update: false, delete: false },
    ],
  },
]

export default function RBAC() {
  const [roles, setRoles] = useState<Role[]>(PLACEHOLDER_ROLES)
  const [modules, setModules] = useState<Module[]>(PLACEHOLDER_MODULES)
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>(PLACEHOLDER_PERMISSIONS)

  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [addModuleOpen, setAddModuleOpen] = useState(false)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const handleAddRole = (role: Role) => {
    setRoles((prev) => [...prev, role])
    setRolePermissions((prev) => [
      ...prev,
      {
        roleId: role.id,
        permissions: modules.map((m) => ({
          moduleId: m.id,
          create: false,
          read: false,
          update: false,
          delete: false,
        })),
      },
    ])
  }

  const handleAddModule = (module: Module) => {
    setModules((prev) => [...prev, module])
    setRolePermissions((prev) =>
      prev.map((rp) => ({
        ...rp,
        permissions: [
          ...rp.permissions,
          { moduleId: module.id, create: false, read: false, update: false, delete: false },
        ],
      }))
    )
  }

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role)
    setPermissionsOpen(true)
  }

  const handleSavePermissions = (roleId: string, permissions: Permission[]) => {
    setRolePermissions((prev) =>
      prev.map((rp) => (rp.roleId === roleId ? { ...rp, permissions } : rp))
    )
  }

  const getSelectedRolePermissions = (): Permission[] => {
    if (!selectedRole) return []
    return rolePermissions.find((rp) => rp.roleId === selectedRole.id)?.permissions || []
  }

  const getPermissionCount = (roleId: string): number => {
    const rp = rolePermissions.find((rp) => rp.roleId === roleId)
    if (!rp) return 0
    return rp.permissions.reduce(
      (acc, p) => acc + (p.create ? 1 : 0) + (p.read ? 1 : 0) + (p.update ? 1 : 0) + (p.delete ? 1 : 0),
      0
    )
  }

  const getMaxPermissions = (): number => modules.length * 4

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Access Control</h1>
          <p className="mt-1 text-muted-foreground">
            Manage roles and permissions across your application
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border bg-card p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Roles
            </p>
            <p className="mt-1 text-3xl font-semibold">{roles.length}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-brand/10">
            <Shield className="size-6 text-brand" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border bg-card p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Modules
            </p>
            <p className="mt-1 text-3xl font-semibold">{modules.length}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-purple-500/10">
            <Box className="size-6 text-purple-500" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border bg-card p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Permissions
            </p>
            <p className="mt-1 text-3xl font-semibold">{modules.length * 4}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
            <Key className="size-6 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-brand" />
            <h2 className="font-medium">Roles</h2>
            <Badge variant="secondary" className="font-normal">{roles.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAddModuleOpen(true)}>
              <Box className="mr-1.5 size-4" />
              Add Module
            </Button>
            <Button
              variant="outline"
              onClick={() => setAddRoleOpen(true)}
              className="gap-2 border-brand/50 text-brand hover:bg-brand/10"
            >
              <Plus className="size-4" />
              Add Role
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No roles created yet
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => {
                  const permCount = getPermissionCount(role.id)
                  const maxPerms = getMaxPermissions()
                  return (
                    <TableRow
                      key={role.id}
                      className="cursor-pointer"
                      onClick={() => handleRoleClick(role)}
                    >
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="line-clamp-1">{role.description || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${maxPerms > 0 ? (permCount / maxPerms) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {permCount}/{maxPerms}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => { e.stopPropagation(); handleRoleClick(role) }}
                          >
                            <Pencil className="size-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Click on a role to manage its permissions
        </p>
      </div>

      {/* Dialogs */}
      <AddRoleDialog open={addRoleOpen} onOpenChange={setAddRoleOpen} onSuccess={handleAddRole} />
      <AddModuleDialog open={addModuleOpen} onOpenChange={setAddModuleOpen} onSuccess={handleAddModule} />
      <PermissionsMatrixDialog
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
        role={selectedRole}
        modules={modules}
        initialPermissions={getSelectedRolePermissions()}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
