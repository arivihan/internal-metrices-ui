import { useState, useEffect } from "react";
import { Eye, Loader2, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { fetchNoteById } from "@/services/notes";
import type { NotesResponseDto } from "@/types/notes";

interface ViewNoteDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string | null;
}

const NOTE_TYPES: Record<string, string> = {
  TOPPER_NOTES: "Topper Notes",
  PREVIOUS_YEAR_PAPER: "Previous Year Paper",
  NCERT_SOLUTION: "NCERT Solution",
  IMPORTANT_NOTES: "Important Notes",
  HANDWRITTEN_NOTES: "Handwritten Notes",
  PRINTED_NOTES: "Printed Notes",
  STUDY_MATERIAL: "Study Material",
  QUESTION_BANK: "Question Bank",
  SAMPLE_PAPER: "Sample Paper",
  SOLUTION: "Solution",
  OTHER: "Other",
};

const ACCESS_TYPE_COLORS: Record<string, string> = {
  FREE: "bg-green-100 text-green-800 border-green-200",
  BASIC: "bg-cyan-100 text-cyan-800 border-cyan-200",
  PREMIUM: "bg-cyan-100 text-cyan-800 border-cyan-200",
};

export function ViewNoteDetailsDialog({
  open,
  onOpenChange,
  noteId,
}: ViewNoteDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [noteDetails, setNoteDetails] = useState<NotesResponseDto | null>(null);

  useEffect(() => {
    if (open && noteId) {
      loadNoteDetails();
    } else {
      setNoteDetails(null);
    }
  }, [open, noteId]);

  const loadNoteDetails = async () => {
    if (!noteId) return;

    setLoading(true);
    try {
      const response = await fetchNoteById(noteId);
      if (response.success && response.data) {
        setNoteDetails(response.data);
      } else {
        toast.error(response.message || "Failed to load note details");
      }
    } catch (error) {
      console.error("[ViewNoteDetailsDialog] Error loading note:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load note details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getTypeDisplay = (type: string) => {
    return NOTE_TYPES[type] || type;
  };

  const getAccessTypeColor = (accessType: string) => {
    return ACCESS_TYPE_COLORS[accessType] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-cyan-600" />
            Note Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading details...</span>
          </div>
        ) : noteDetails ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Title & Code */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{noteDetails.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Code: {noteDetails.code || noteDetails.notesCode}
                  </Badge>
                  {/* <Badge variant="outline" className="text-xs">
                    ID: {noteDetails.id}
                  </Badge> */}
                </div>
              </div>

              <Separator />

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Subject</label>
                  <p className="font-medium">{noteDetails.subject || noteDetails.subjectName || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Notes By</label>
                  <p className="font-medium">{noteDetails.notesBy || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Type</label>
                  <p>
                    <Badge variant="outline">
                      {getTypeDisplay(noteDetails.type || noteDetails.notesType || "")}
                    </Badge>
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Access Type</label>
                  <p>
                    <Badge
                      variant="outline"
                      className={getAccessTypeColor(noteDetails.accessType || "")}
                    >
                      {noteDetails.accessType || "-"}
                    </Badge>
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Display Order</label>
                  <p className="font-medium">{noteDetails.displayOrder}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <p>
                    <Badge
                      variant={noteDetails.isActive ? "default" : "secondary"}
                      className={noteDetails.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {noteDetails.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {noteDetails.locked && (
                      <Badge variant="destructive" className="ml-2">
                        Locked
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              <Separator />

              {/* URL */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Notes URL</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm break-all flex-1 text-cyan-600">
                    {noteDetails.url || noteDetails.notesUrl || "-"}
                  </p>
                  {(noteDetails.url || noteDetails.notesUrl) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(noteDetails.url || noteDetails.notesUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Batches */}
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground font-medium">
                  Mapped Batches ({noteDetails.batches?.length || 0})
                </label>
                {noteDetails.batches && noteDetails.batches.length > 0 ? (
                  <div className="space-y-2">
                    {noteDetails.batches.map((batch, index) => (
                      <div
                        key={batch.batchId || index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                      >
                        <div>
                          <p className="font-medium">{batch.batchName}</p>
                          <p className="text-xs text-muted-foreground break-words">
                            {batch.batchCode}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          ID: {batch.batchId}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No batches mapped</p>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No note details available</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
