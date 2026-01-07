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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

import type { Role, Module, Permission } from '@/types/rbac'

interface PermissionsMatrixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  modules: Module[]
  initialPermissions: Permission[]
  onSave: (roleId: string, permissions: Permission[]) => void
}

type PermissionKey = 'create' | 'read' | 'update' | 'delete'

const PERMISSION_COLUMNS: { key: PermissionKey; label: string; headerColor: string; checkedClass: string }[] = [
  { key: 'create', label: 'C', headerColor: 'text-emerald-400', checkedClass: 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500' },
  { key: 'read', label: 'R', headerColor: 'text-blue-400', checkedClass: 'data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500' },
  { key: 'update', label: 'U', headerColor: 'text-amber-400', checkedClass: 'data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500' },
  { key: 'delete', label: 'D', headerColor: 'text-red-400', checkedClass: 'data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500' },
]

export function PermissionsMatrixDialog({
  open,
  onOpenChange,
  role,
  modules,
  initialPermissions,
  onSave,
}: PermissionsMatrixDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    if (open && role) {
      const newPermissions = modules.map((module) => {
        const existing = initialPermissions.find((p) => p.moduleId === module.id)
        return existing || { moduleId: module.id, create: false, read: false, update: false, delete: false }
      })
      setPermissions(newPermissions)
    }
  }, [open, role, modules, initialPermissions])

  const handleClose = () => {
    if (!isSubmitting) onOpenChange(false)
  }

  const togglePermission = (moduleId: string, key: PermissionKey) => {
    setPermissions((prev) =>
      prev.map((p) => (p.moduleId === moduleId ? { ...p, [key]: !p[key] } : p))
    )
  }

  const toggleSelectAll = (moduleId: string) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.moduleId !== moduleId) return p
        const allSelected = p.create && p.read && p.update && p.delete
        return { ...p, create: !allSelected, read: !allSelected, update: !allSelected, delete: !allSelected }
      })
    )
  }

  const isAllSelected = (moduleId: string) => {
    const perm = permissions.find((p) => p.moduleId === moduleId)
    return perm ? perm.create && perm.read && perm.update && perm.delete : false
  }

  const getPermission = (moduleId: string, key: PermissionKey) => {
    return permissions.find((p) => p.moduleId === moduleId)?.[key] ?? false
  }

  const handleSave = async () => {
    if (!role) return
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      onSave(role.id, permissions)
      toast.success(`Permissions updated for ${role.name}`)
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save permissions')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
              <Shield className="size-5 text-brand" />
            </div>
            <div>
              <DialogTitle className="text-lg">{role.name}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {role.description || 'Configure module permissions'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Matrix Table */}
        <div className="max-h-[50vh] overflow-y-auto">
          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No modules available</p>
              <p className="mt-1 text-sm text-muted-foreground">Add modules first to assign permissions</p>
            </div>
          ) : (
            <Table className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-50">Module</TableHead>
                  {PERMISSION_COLUMNS.map(({ key, label, headerColor }) => (
                    <TableHead key={key} className={cn('w-16 text-center font-semibold', headerColor)}>
                      {label}
                    </TableHead>
                  ))}
                  <TableHead className="w-16 text-center">All</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => {
                  const allSelected = isAllSelected(module.id)
                  return (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{module.name}</p>
                          {module.description && (
                            <p className="text-xs text-muted-foreground">{module.description}</p>
                          )}
                        </div>
                      </TableCell>
                      {PERMISSION_COLUMNS.map(({ key, checkedClass }) => {
                        const isActive = getPermission(module.id, key)
                        return (
                          <TableCell key={key} className="text-center">
                            <Checkbox
                              checked={isActive}
                              onCheckedChange={() => togglePermission(module.id, key)}
                              className={cn('mx-auto size-5', checkedClass)}
                            />
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => toggleSelectAll(module.id)}
                          className="mx-auto size-5 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
