import { useState, useEffect } from 'react'
import { Loader2, Box } from 'lucide-react'
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

import type { Module } from '@/types/rbac'

interface AddModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (module: Module) => void
}

export function AddModuleDialog({ open, onOpenChange, onSuccess }: AddModuleDialogProps) {
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
      toast.error('Module name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const newModule: Module = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        description: formData.description.trim(),
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('Module created successfully')
      onSuccess(newModule)
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create module')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Box className="size-5 text-purple-500" />
            </div>
            <div>
              <DialogTitle>Create Module</DialogTitle>
              <DialogDescription className="mt-0.5">
                Add a new module to control access
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="moduleName">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="moduleName"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Users, Orders, Reports"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moduleDescription">Description</Label>
            <Textarea
              id="moduleDescription"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What does this module control access to?"
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
