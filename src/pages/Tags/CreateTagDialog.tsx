import { useState, useEffect } from "react";
import { Plus, Loader2, Tag, Hash, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { createTag } from "@/services/tags";
import type { TagRequest } from "@/types/tags";

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTagDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTagDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TagRequest>({
    name: "",
    slug: "",
  });
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({ name: "", slug: "" });
      setAutoGenerateSlug(true);
    }
  }, [open]);

  // Auto-generate slug from name
  useEffect(() => {
    if (autoGenerateSlug && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, autoGenerateSlug]);

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: keyof TagRequest, value: string) => {
    if (field === "slug") {
      setAutoGenerateSlug(false);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    if (!formData.slug.trim()) {
      toast.error("Tag slug is required");
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error("Slug must contain only lowercase letters, numbers, and hyphens");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTag(formData);
      toast.success("Tag created successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("[CreateTagDialog] Create error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create tag"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-violet-500" />
            Create New Tag
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Tag Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              Tag Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter tag name"
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name for your tag
            </p>
          </div>

          {/* Tag Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-violet-500" />
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleInputChange("slug", e.target.value.toLowerCase())}
              placeholder="enter-slug-here"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          {/* Preview */}
          {formData.name && (
            <div className="rounded-lg border p-4">
              <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <Hash className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <div className="font-medium">{formData.name}</div>
                  <Badge variant="outline" className="font-mono text-xs mt-1">
                    {formData.slug}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.slug.trim()}
            className="bg-violet-500 hover:bg-violet-600"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Plus className="mr-2 h-4 w-4" />
            Create Tag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
