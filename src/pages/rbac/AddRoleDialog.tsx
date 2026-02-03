import { useState, useEffect } from 'react'
import { Loader2, Shield, Lock } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

import type { Role, RolePermission } from '@/types/rbac'
import { createRole } from '@/services/roles'
import { fetchPermissions } from '@/services/permissions'

interface AddRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (role: Role) => void
}

export function AddRoleDialog({ open, onOpenChange, onSuccess }: AddRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', externalRole: true })
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])

  // Permissions state
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  // Fetch permissions when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({ name: '', externalRole: true })
      setSelectedPermissionIds([])
      loadPermissions()
    }
  }, [open])

  const loadPermissions = async () => {
    setPermissionsLoading(true)
    try {
      const response = await fetchPermissions({ page: 0, size: 100 })
      setPermissions(response.content)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      toast.error('Failed to load permissions')
    } finally {
      setPermissionsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) onOpenChange(false)
  }

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createRole({
        roleName: formData.name.trim(),
        externalRole: formData.externalRole,
        permissionIds: selectedPermissionIds,
      })

      toast.success(response.message || 'Role created successfully')
      onSuccess(response.data)
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create role')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
              <Shield className="size-5 text-brand" />
            </div>
            <div>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription className="mt-0.5">
                Add a new role with permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[500px] space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="roleName">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="roleName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., ADMIN, MANAGER, OPERATOR"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="externalRole">External Role</Label>
              <p className="text-xs text-muted-foreground">
                Enable if this role is for external users
              </p>
            </div>
            <Switch
              id="externalRole"
              checked={formData.externalRole}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, externalRole: checked }))}
            />
          </div>

          {/* Permissions Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              <Label>Permissions</Label>
              {selectedPermissionIds.length > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {selectedPermissionIds.length} selected
                </Badge>
              )}
            </div>

            {permissionsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading permissions...
                </div>
              </div>
            ) : permissions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No permissions available
              </div>
            ) : (
              <div className="max-h-[200px] space-y-1 overflow-y-auto rounded-lg border p-2">
                {permissions.map((permission) => (
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
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
