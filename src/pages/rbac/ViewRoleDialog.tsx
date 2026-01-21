import { useState, useEffect } from 'react'
import { Loader2, Shield, Lock, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

import type { RoleDetail, RolePermission } from '@/types/rbac'
import { fetchRoleById, addPermissionsToRole, removePermissionsFromRole } from '@/services/roles'
import { fetchPermissions } from '@/services/permissions'

interface ViewRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleId: string | null
  onUpdate?: () => void
}

export function ViewRoleDialog({ open, onOpenChange, roleId, onUpdate }: ViewRoleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null)

  // Add permissions state
  const [showAddPermissions, setShowAddPermissions] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState<RolePermission[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [addingPermissions, setAddingPermissions] = useState(false)
  const [removingPermissionId, setRemovingPermissionId] = useState<number | null>(null)

  useEffect(() => {
    if (open && roleId) {
      loadRoleDetails()
      setShowAddPermissions(false)
      setSelectedPermissionIds([])
    } else {
      setRoleDetail(null)
    }
  }, [open, roleId])

  const loadRoleDetails = async () => {
    if (!roleId) return

    setLoading(true)
    try {
      const response = await fetchRoleById(roleId)
      setRoleDetail(response.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load role details')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailablePermissions = async () => {
    if (!roleDetail) return

    setLoadingAvailable(true)
    try {
      const response = await fetchPermissions({ page: 0, size: 100 })
      // Filter out permissions already assigned to the role
      const assignedIds = roleDetail.permissions.map((p) => p.id)
      const available = response.content.filter((p) => !assignedIds.includes(p.id))
      setAvailablePermissions(available)
    } catch (error) {
      toast.error('Failed to load available permissions')
    } finally {
      setLoadingAvailable(false)
    }
  }

  const handleShowAddPermissions = () => {
    setShowAddPermissions(true)
    setSelectedPermissionIds([])
    loadAvailablePermissions()
  }

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleAddPermissions = async () => {
    if (!roleId || selectedPermissionIds.length === 0) return

    setAddingPermissions(true)
    try {
      const response = await addPermissionsToRole(roleId, { permissionIds: selectedPermissionIds })
      toast.success(response.message || 'Permissions added successfully')
      setRoleDetail(response.data)
      setShowAddPermissions(false)
      setSelectedPermissionIds([])
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add permissions')
    } finally {
      setAddingPermissions(false)
    }
  }

  const handleRemovePermission = async (permissionId: number) => {
    if (!roleId) return

    setRemovingPermissionId(permissionId)
    try {
      const response = await removePermissionsFromRole(roleId, { permissionIds: [permissionId] })
      toast.success(response.message || 'Permission removed successfully')
      setRoleDetail(response.data)
      onUpdate?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove permission')
    } finally {
      setRemovingPermissionId(null)
    }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
              <Shield className="size-5 text-brand" />
            </div>
            <div>
              <DialogTitle>Role Details</DialogTitle>
              <DialogDescription className="mt-0.5">
                View and manage role permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[600px] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Loading role details...
              </div>
            </div>
          ) : roleDetail ? (
            <div className="space-y-6">
              {/* Role Info */}
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Role Name
                    </p>
                    <p className="mt-1 text-lg font-semibold">{roleDetail.roleName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Type
                    </p>
                    <Badge
                      variant={roleDetail.externalRole ? 'outline' : 'secondary'}
                      className="mt-1"
                    >
                      {roleDetail.externalRole ? 'External' : 'Internal'}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  ID: {roleDetail.roleId}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-muted-foreground" />
                    <h3 className="font-medium">Permissions</h3>
                    <Badge variant="secondary" className="font-normal">
                      {roleDetail.permissions.length}
                    </Badge>
                  </div>
                  {!showAddPermissions && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShowAddPermissions}
                      className="gap-1"
                    >
                      <Plus className="size-4" />
                      Add Permission
                    </Button>
                  )}
                </div>

                {/* Add Permissions Section */}
                {showAddPermissions && (
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Select permissions to add</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => setShowAddPermissions(false)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    {loadingAvailable ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          Loading permissions...
                        </div>
                      </div>
                    ) : availablePermissions.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No additional permissions available
                      </div>
                    ) : (
                      <>
                        <div className="max-h-[150px] space-y-1 overflow-y-auto rounded-md border bg-background p-2">
                          {availablePermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={selectedPermissionIds.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{permission.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {permission.module} • {permission.httpMethod} • {permission.apiPattern}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddPermissions(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddPermissions}
                            disabled={selectedPermissionIds.length === 0 || addingPermissions}
                          >
                            {addingPermissions && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Add {selectedPermissionIds.length > 0 && `(${selectedPermissionIds.length})`}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Permissions Table */}
                {roleDetail.permissions.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No permissions assigned to this role
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>API Pattern</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleDetail.permissions.map((permission: RolePermission) => (
                          <TableRow key={permission.id}>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemovePermission(permission.id)}
                                disabled={removingPermissionId === permission.id}
                              >
                                {removingPermissionId === permission.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <X className="size-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
