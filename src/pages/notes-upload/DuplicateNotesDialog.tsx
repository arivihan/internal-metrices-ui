import { useState, useEffect } from "react";
import { Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { duplicateNotes, fetchAllBatchesForNotes } from "@/services/notes";
import type {
  NotesResponseDto,
  BatchOption,
  DuplicateNotesRequest,
} from "@/types/notes";

interface DuplicateNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNotes: NotesResponseDto[];
  onSuccess: () => void;
}

export function DuplicateNotesDialog({
  open,
  onOpenChange,
  selectedNotes,
  onSuccess,
}: DuplicateNotesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [displayOrders, setDisplayOrders] = useState<Record<string, number>>({});

  // Get all batch IDs where selected notes are already mapped
  const mappedBatchIds = Array.from(
    new Set(
      selectedNotes.flatMap((note) =>
        note.batches?.map((b) => b.batchId) || []
      )
    )
  );

  // Check if a batch already has any of the selected notes mapped
  const isBatchMapped = (batchId: number) => mappedBatchIds.includes(batchId);

  // Load batch options when dialog opens
  useEffect(() => {
    if (open) {
      loadBatchOptions();
      setSelectedBatchId(null); // Reset selection
      // Initialize displayOrders from selected notes
      const initialOrders: Record<string, number> = {};
      selectedNotes.forEach((note) => {
        initialOrders[note.id] = note.displayOrder ?? 0;
      });
      setDisplayOrders(initialOrders);
    }
  }, [open, selectedNotes]);

  const loadBatchOptions = async () => {
    setLoading(true);
    try {
      console.log("[DuplicateNotesDialog] Loading batch options...");
      const batchesRes = await fetchAllBatchesForNotes({ activeFlag: true });
      console.log("[DuplicateNotesDialog] Batch options loaded:", batchesRes);
      setBatches(batchesRes);
    } catch (error) {
      console.error(
        "[DuplicateNotesDialog] Failed to load batch options:",
        error
      );
      toast.error("Failed to load batch options");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleBatchSelect = (batchId: number) => {
    // Toggle: if already selected, deselect; otherwise select
    if (selectedBatchId === batchId) {
      setSelectedBatchId(null);
    } else {
      setSelectedBatchId(batchId);
    }
  };

  const handleDisplayOrderChange = (noteId: string, value: number) => {
    setDisplayOrders((prev) => ({
      ...prev,
      [noteId]: value,
    }));
  };

  // Count non-mapped batches for display
  const selectableBatches = batches.filter((b) => !isBatchMapped(b.id));

  const handleDuplicate = async () => {
    if (!selectedBatchId) {
      toast.error("Please select a target batch");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the duplicate request payload
      const duplicateRequest: DuplicateNotesRequest = {
        selectedNotes: selectedNotes.map((note) => ({
          notesId: Number(note.id),
          displayOrder: displayOrders[note.id] ?? note.displayOrder ?? 0,
        })),
        targetBatchIds: [selectedBatchId],
      };

      console.log(
        "[DuplicateNotesDialog] Duplicating notes:",
        duplicateRequest
      );

      const response = await duplicateNotes(duplicateRequest);

      if (response.success || response.message) {
        toast.success(response.message || "Notes successfully copied");
        onSuccess();
        handleClose();
      } else {
        toast.error(response.message || "Failed to duplicate notes");
      }
    } catch (error) {
      console.error("[DuplicateNotesDialog] Duplication error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to duplicate notes"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-cyan-600" />
            Duplicate Notes to Other Batches
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy {selectedNotes.length} selected note
            {selectedNotes.length > 1 ? "s" : ""} to a target batch
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Notes Summary */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Selected Notes ({selectedNotes.length})
            </Label>
            <ScrollArea className="h-40 rounded-md border p-3">
              <div className="space-y-3">
                {selectedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center gap-4 text-sm border-b pb-2 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{note.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Note ID: {note.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">Display Order:</Label>
                      <Input
                        type="number"
                        value={displayOrders[note.id] ?? note.displayOrder ?? 0}
                        onChange={(e) =>
                          handleDisplayOrderChange(note.id, parseInt(e.target.value) || 0)
                        }
                        className="w-20 h-8 text-sm"
                        min={0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Target Batch Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Select Target Batch
              </Label>
              <span className="text-sm text-muted-foreground">
                {selectableBatches.length} available
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading batches...
                </span>
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
                      <div
                        key={batch.id}
                        className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-accent ${
                          selectedBatchId === batch.id ? "bg-accent" : ""
                        } ${isBatchMapped(batch.id) || (selectedBatchId && selectedBatchId !== batch.id) ? "opacity-50" : ""}`}
                        onClick={() => !isBatchMapped(batch.id) && handleBatchSelect(batch.id)}
                      >
                        <Checkbox
                          checked={selectedBatchId === batch.id}
                          onCheckedChange={() => handleBatchSelect(batch.id)}
                          disabled={isBatchMapped(batch.id) || (selectedBatchId !== null && selectedBatchId !== batch.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{batch.name}</span>
                            {isBatchMapped(batch.id) && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Mapped
                              </Badge>
                            )}
                          </div>
                          {batch.code && (
                            <div className="text-xs text-muted-foreground break-words">
                              {batch.code}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}

            {selectedBatchId && (
              <div className="text-sm text-cyan-600">
                1 batch selected
              </div>
            )}
          </div>
        </div>

        <DialogFooter className=" border border-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={isSubmitting || !selectedBatchId}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Copy className="mr-2 h-4 w-4" />
            Duplicate to Batch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
