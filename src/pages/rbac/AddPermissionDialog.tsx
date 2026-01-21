import { useState, useEffect } from 'react'
import { Loader2, Lock } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { RolePermission } from '@/types/rbac'
import { createPermission } from '@/services/permissions'

interface AddPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (permission: RolePermission) => void
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ALL'] as const

export function AddPermissionDialog({ open, onOpenChange, onSuccess }: AddPermissionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    module: '',
    httpMethod: 'GET',
    apiPattern: '',
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        module: '',
        httpMethod: 'GET',
        apiPattern: '',
      })
    }
  }, [open])

  const handleClose = () => {
    if (!isSubmitting) onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Permission name is required')
      return
    }
    if (!formData.module.trim()) {
      toast.error('Module is required')
      return
    }
    if (!formData.apiPattern.trim()) {
      toast.error('API pattern is required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await createPermission({
        name: formData.name.trim(),
        module: formData.module.trim(),
        httpMethod: formData.httpMethod,
        apiPattern: formData.apiPattern.trim(),
      })

      toast.success(response.message || 'Permission created successfully')
      onSuccess(response.data)
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create permission')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Lock className="size-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Create Permission</DialogTitle>
              <DialogDescription className="mt-0.5">
                Add a new permission to manage API access
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="permissionName">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permissionName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., View Users, Create Reports"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permissionModule">
              Module <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permissionModule"
              value={formData.module}
              onChange={(e) => setFormData((prev) => ({ ...prev, module: e.target.value }))}
              placeholder="e.g., users, reports, settings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="httpMethod">
              HTTP Method <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.httpMethod}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, httpMethod: value }))}
            >
              <SelectTrigger id="httpMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiPattern">
              API Pattern <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apiPattern"
              value={formData.apiPattern}
              onChange={(e) => setFormData((prev) => ({ ...prev, apiPattern: e.target.value }))}
              placeholder="e.g., /api/users/**, /api/reports/*"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Use * for wildcards (e.g., /api/users/* matches /api/users/123)
            </p>
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
