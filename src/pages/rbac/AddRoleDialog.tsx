import { useState, useEffect } from 'react'
import { Loader2, Shield } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'

import type { Role } from '@/types/rbac'

interface AddRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (role: Role) => void
}

export function AddRoleDialog({ open, onOpenChange, onSuccess }: AddRoleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    if (open) setFormData({ name: '', description: '' })
  }, [open])

  const handleClose = () => {
    if (!isSubmitting) onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Role name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const newRole: Role = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Role created successfully')
      onSuccess(newRole)
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create role')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
              <Shield className="size-5 text-brand" />
            </div>
            <div>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription className="mt-0.5">
                Add a new role to manage permissions
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="roleName">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="roleName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Admin, Editor, Viewer"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleDescription">Description</Label>
            <Textarea
              id="roleDescription"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this role's purpose..."
              rows={3}
              className="resize-none"
            />
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
