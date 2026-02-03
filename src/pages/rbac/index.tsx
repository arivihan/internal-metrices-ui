import { useState } from 'react'
import { Plus, Shield, Pencil, Trash2, Key, Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

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
import { cn } from '@/lib/utils'

import { AddRoleDialog } from './AddRoleDialog'
import { AddPermissionDialog } from './AddPermissionDialog'
import { EditPermissionDialog } from './EditPermissionDialog'
import { ViewRoleDialog } from './ViewRoleDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

import type { Role, RolePermission } from '@/types/rbac'
import { useRoles } from '@/hooks/useRoles'
import { usePermissions } from '@/hooks/usePermissions'
import { deletePermission } from '@/services/permissions'

type ActiveView = 'roles' | 'permissions'

export default function RBAC() {
  // Fetch roles and permissions from API
  const { roles, loading: rolesLoading, error: rolesError, refresh: refreshRoles } = useRoles()
  const { permissions, loading: permissionsLoading, error: permissionsError, refresh: refreshPermissions } = usePermissions()

  const [activeView, setActiveView] = useState<ActiveView>('roles')
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [addPermissionOpen, setAddPermissionOpen] = useState(false)
  const [editPermissionOpen, setEditPermissionOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [viewRoleOpen, setViewRoleOpen] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedPermission, setSelectedPermission] = useState<RolePermission | null>(null)
  const [permissionToDelete, setPermissionToDelete] = useState<RolePermission | null>(null)

  const handleAddRole = () => {
    // After successfully adding role via API, refresh the list
    refreshRoles()
  }

  const handleAddPermission = () => {
    // After successfully adding permission via API, refresh the list
    refreshPermissions()
  }

  const handleEditPermission = (permission: RolePermission) => {
    setSelectedPermission(permission)
    setEditPermissionOpen(true)
  }

  const handleUpdatePermission = () => {
    // After successfully updating permission via API, refresh the list
    refreshPermissions()
  }

  const handleDeletePermissionClick = (permission: RolePermission) => {
    setPermissionToDelete(permission)
    setDeleteConfirmOpen(true)
  }

  const handleDeletePermissionConfirm = async () => {
    if (!permissionToDelete) return

    try {
      const response = await deletePermission(permissionToDelete.id)
      toast.success(response.message || 'Permission deleted successfully')
      refreshPermissions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete permission')
      throw error // Re-throw to let dialog handle loading state
    }
  }

  const handleRoleClick = (role: Role) => {
    setSelectedRoleId(role.roleId)
    setViewRoleOpen(true)
  }

  const getMethodBadgeVariant = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'default'
      case 'POST':
        return 'default'
      case 'PUT':
        return 'default'
      case 'PATCH':
        return 'default'
      case 'DELETE':
        return 'destructive'
      case 'ALL':
        return 'secondary'
      default:
        return 'outline'
    }
  }


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
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setActiveView('roles')}
          className={cn(
            'flex items-center justify-between rounded-xl border bg-card p-5 text-left transition-all',
            activeView === 'roles' ? 'ring-2 ring-brand' : 'hover:border-brand/50'
          )}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Roles
            </p>
            <p className="mt-1 text-3xl font-semibold">{roles.length}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-brand/10">
            <Shield className="size-6 text-brand" />
          </div>
        </button>
        <button
          onClick={() => setActiveView('permissions')}
          className={cn(
            'flex items-center justify-between rounded-xl border bg-card p-5 text-left transition-all',
            activeView === 'permissions' ? 'ring-2 ring-amber-500' : 'hover:border-amber-500/50'
          )}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Permissions
            </p>
            <p className="mt-1 text-3xl font-semibold">{permissions.length}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
            <Key className="size-6 text-amber-500" />
          </div>
        </button>
      </div>

      {/* Roles Table */}
      {activeView === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-brand" />
              <h2 className="font-medium">Roles</h2>
              <Badge variant="secondary" className="font-normal">{roles.length}</Badge>
            </div>
            <Button
              variant="outline"
              onClick={() => setAddRoleOpen(true)}
              className="gap-2 border-brand/50 text-brand hover:bg-brand/10"
            >
              <Plus className="size-4" />
              Add Role
            </Button>
          </div>

          {rolesError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">Error loading roles</p>
              <p className="mt-1 text-xs">{rolesError}</p>
            </div>
          )}

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading roles...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No roles found
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => {
                    return (
                      <TableRow
                        key={role.roleId}
                        className="cursor-pointer"
                        onClick={() => handleRoleClick(role)}
                      >
                        <TableCell className="text-xs text-muted-foreground">{role.roleId}</TableCell>
                        <TableCell className="font-medium">{role.roleName}</TableCell>
                        <TableCell>
                          <Badge variant={role.externalRole ? 'outline' : 'secondary'} className="font-normal">
                            {role.externalRole ? 'External' : 'Internal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={(e) => { e.stopPropagation(); handleRoleClick(role) }}
                            >
                              <Pencil className="size-4 text-muted-foreground" />
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
            Click on a role to view details and permissions
          </p>
        </div>
      )}

      {/* Permissions Table */}
      {activeView === 'permissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-amber-500" />
              <h2 className="font-medium">Permissions</h2>
              <Badge variant="secondary" className="font-normal">{permissions.length}</Badge>
            </div>
            <Button
              variant="outline"
              onClick={() => setAddPermissionOpen(true)}
              className="gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
            >
              <Plus className="size-4" />
              Add Permission
            </Button>
          </div>

          {permissionsError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">Error loading permissions</p>
              <p className="mt-1 text-xs">{permissionsError}</p>
            </div>
          )}

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>HTTP Method</TableHead>
                  <TableHead>API Pattern</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading permissions...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No permissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="text-xs text-muted-foreground">{permission.id}</TableCell>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {permission.module}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getMethodBadgeVariant(permission.httpMethod)}
                          className="font-mono text-xs font-normal"
                        >
                          {permission.httpMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {permission.apiPattern}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleEditPermission(permission)}
                          >
                            <Pencil className="size-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePermissionClick(permission)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Permissions define specific API access controls for roles
          </p>
        </div>
      )}

      {/* Dialogs */}
      <AddRoleDialog open={addRoleOpen} onOpenChange={setAddRoleOpen} onSuccess={handleAddRole} />
      <AddPermissionDialog open={addPermissionOpen} onOpenChange={setAddPermissionOpen} onSuccess={handleAddPermission} />
      <EditPermissionDialog open={editPermissionOpen} onOpenChange={setEditPermissionOpen} permission={selectedPermission} onSuccess={handleUpdatePermission} />
      <ViewRoleDialog open={viewRoleOpen} onOpenChange={setViewRoleOpen} roleId={selectedRoleId} onUpdate={refreshRoles} />
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Permission"
        description={permissionToDelete ? `Are you sure you want to delete "${permissionToDelete.name}"?` : ''}
        onConfirm={handleDeletePermissionConfirm}
      />
    </div>
  )
}
