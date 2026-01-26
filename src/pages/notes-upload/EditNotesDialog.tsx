import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { updateNote } from "@/services/notes";
import type { NotesResponseDto } from "@/types/notes";

interface EditNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NotesResponseDto | null;
  onSuccess: () => void;
}

const NOTES_TYPES = {
  PREVIOUS_YEAR_PAPER: "Previous Year Paper",
  NOTES: "Notes",
  SAMPLE_PAPER: "Sample Paper",
  PRACTICE_SET: "Practice Set",
};

const ACCESS_TYPES = {
  LOCKED: "Locked",
  UNLOCKED: "Unlocked",
};

interface FormData {
  code: string;
  title: string;
  url: string;
  accessType: string;
  type: string;
  position: number;
  isActive: boolean;
  subject: string;
}

export function EditNotesDialog({
  open,
  onOpenChange,
  note,
  onSuccess,
}: EditNotesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: "",
    title: "",
    url: "",
    accessType: "UNLOCKED",
    type: "NOTES",
    position: 0,
    isActive: true,
    subject: "",
  });

  // Populate form when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        code: note.notesCode || "",
        title: note.title || "",
        url: note.notesUrl || "",
        accessType: note.locked ? "LOCKED" : "UNLOCKED",
        type: note.notesType || "NOTES",
        position: note.position || 0,
        isActive: note.isActive ?? true,
        subject: note.subjectName || "",
      });
    }
  }, [note]);

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error("Please enter a code");
      return false;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!note || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await updateNote(note.id, {
        code: formData.code,
        title: formData.title,
        url: formData.url,
        accessType: formData.accessType,
        type: formData.type,
        position: formData.position,
        isActive: formData.isActive,
        subject: formData.subject,
      });

      toast.success("Note updated successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update note"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update note details for {note?.notesCode}
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Code */}
          <div className="grid gap-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              placeholder="Enter code"
            />
          </div>

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter title"
            />
          </div>

          {/* URL */}
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="Enter notes URL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTES_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Access Type */}
            <div className="grid gap-2">
              <Label htmlFor="accessType">Access Type</Label>
              <Select
                value={formData.accessType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, accessType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCESS_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Position (Display Order) */}
            <div className="grid gap-2">
              <Label htmlFor="position">Position (Display Order)</Label>
              <Input
                id="position"
                type="number"
                value={formData.position}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    position: Number(e.target.value),
                  }))
                }
                placeholder="Enter position"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable/disable
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
