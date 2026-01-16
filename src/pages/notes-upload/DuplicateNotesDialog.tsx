import { useState, useEffect } from 'react'
import { Copy, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

import { duplicateNotes, fetchAllBatchesForNotes } from '@/services/notes'
import type { NotesResponseDto, BatchOption, DuplicateNotesRequest } from '@/types/notes'

interface DuplicateNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedNotes: NotesResponseDto[]
  onSuccess: () => void
}

export function DuplicateNotesDialog({
  open,
  onOpenChange,
  selectedNotes,
  onSuccess,
}: DuplicateNotesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([])

  // Load batch options when dialog opens
  useEffect(() => {
    if (open) {
      loadBatchOptions()
      setSelectedBatchIds([]) // Reset selections
    }
  }, [open])

  const loadBatchOptions = async () => {
    setLoading(true)
    try {
      console.log('[DuplicateNotesDialog] Loading batch options...')
      const batchesRes = await fetchAllBatchesForNotes({ activeFlag: true })
      console.log('[DuplicateNotesDialog] Batch options loaded:', batchesRes)
      setBatches(batchesRes)
    } catch (error) {
      console.error('[DuplicateNotesDialog] Failed to load batch options:', error)
      toast.error('Failed to load batch options')
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  const handleBatchToggle = (batchId: number, checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(prev => [...prev, batchId])
    } else {
      setSelectedBatchIds(prev => prev.filter(id => id !== batchId))
    }
  }

  const handleSelectAllBatches = (checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(batches.map(b => b.id))
    } else {
      setSelectedBatchIds([])
    }
  }

  const isAllBatchesSelected = batches.length > 0 && selectedBatchIds.length === batches.length
  const isIndeterminateBatches = selectedBatchIds.length > 0 && selectedBatchIds.length < batches.length

  const handleDuplicate = async () => {
    if (selectedBatchIds.length === 0) {
      toast.error('Please select at least one target batch')
      return
    }

    setIsSubmitting(true)
    try {
      // Prepare the duplicate request payload
      const duplicateRequest: DuplicateNotesRequest = {
        selectedNotes: selectedNotes.map(note => ({
          batchId: note.batchId,
          notesCode: note.notesCode,
        })),
        targetBatchIds: selectedBatchIds,
      }

      console.log('[DuplicateNotesDialog] Duplicating notes:', duplicateRequest)

      const response = await duplicateNotes(duplicateRequest)
      
      if (response.success || response.message) {
        toast.success(response.message || 'Notes successfully copied')
        onSuccess()
        handleClose()
      } else {
        toast.error(response.message || 'Failed to duplicate notes')
      }
    } catch (error) {
      console.error('[DuplicateNotesDialog] Duplication error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate notes')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get unique source batches from selected notes
  const sourceBatches = Array.from(
    new Set(selectedNotes.map(note => note.batchId))
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-cyan-600" />
            Duplicate Notes to Other Batches
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy {selectedNotes.length} selected note{selectedNotes.length > 1 ? 's' : ''} to one or more target batches
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Notes Summary */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Selected Notes ({selectedNotes.length})</Label>
            <ScrollArea className="h-32 rounded-md border p-3">
              <div className="space-y-2">
                {selectedNotes.map((note, index) => (
                  <div key={note.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{note.title}</span>
                      <span className="text-muted-foreground ml-2">({note.notesCode})</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Batch {note.batchId}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="text-xs text-muted-foreground">
              Source batches: {sourceBatches.join(', ')}
            </div>
          </div>

          

          {/* Target Batch Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Select Target Batches</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isAllBatchesSelected}
                  indeterminate={isIndeterminateBatches}
                  onCheckedChange={handleSelectAllBatches}
                  disabled={loading}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading batches...</span>
              </div>
            ) : (
              <ScrollArea className="h-48 rounded-md border p-3">
                <div className="space-y-3">
                  {batches.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No batches available
                    </div>
                  ) : (
                    batches.map((batch) => (
                      <div key={batch.id} className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedBatchIds.includes(batch.id)}
                          onCheckedChange={(checked) => handleBatchToggle(batch.id, checked as boolean)}
                          disabled={sourceBatches.includes(batch.id)} // Disable if it's a source batch
                        />
                        <div className="flex-1">
                          <div className="font-medium">{batch.name}</div>
                          {batch.examName && batch.gradeName && (
                            <div className="text-xs text-muted-foreground">
                              {batch.examName} • {batch.gradeName} • {batch.language}
                            </div>
                          )}
                          {sourceBatches.includes(batch.id) && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Source Batch
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          ID: {batch.id}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {selectedBatchIds.length > 0 && (
              <div className="text-sm text-cyan-600">
                {selectedBatchIds.length} batch{selectedBatchIds.length > 1 ? 'es' : ''} selected
              </div>
            )}
          </div>
        </div>

        <DialogFooter className=' border border-2' >
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDuplicate}
            disabled={isSubmitting || selectedBatchIds.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Copy className="mr-2 h-4 w-4" />
            Duplicate to {selectedBatchIds.length} Batch{selectedBatchIds.length > 1 ? 'es' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}