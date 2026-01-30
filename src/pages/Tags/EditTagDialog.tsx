import { useState, useEffect } from "react";
import { Loader2, Tag, Hash, Sparkles, Save, Film } from "lucide-react";
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

import { fetchTagById, updateTag } from "@/services/tags";
import type { TagRequest, TagResponse } from "@/types/tags";

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  tagId: number | null;
}

export function EditTagDialog({
  open,
  onOpenChange,
  onSuccess,
  tagId,
}: EditTagDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalTag, setOriginalTag] = useState<TagResponse | null>(null);
  const [formData, setFormData] = useState<TagRequest>({
    name: "",
    slug: "",
  });

  // Load tag data when dialog opens
  useEffect(() => {
    if (open && tagId) {
      loadTagData();
    }
  }, [open, tagId]);

  const loadTagData = async () => {
    if (!tagId) return;

    setIsLoading(true);
    try {
      const tag = await fetchTagById(tagId);
      setOriginalTag(tag);
      setFormData({
        name: tag.name,
        slug: tag.slug,
      });
    } catch (error) {
      console.error("[EditTagDialog] Failed to load tag:", error);
      toast.error("Failed to load tag details");
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setOriginalTag(null);
      setFormData({ name: "", slug: "" });
    }
  };

  const handleInputChange = (field: keyof TagRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!tagId) return;

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
      await updateTag(tagId, formData);
      toast.success("Tag updated successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("[EditTagDialog] Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update tag"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges =
    originalTag &&
    (formData.name !== originalTag.name || formData.slug !== originalTag.slug);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-500" />
            Edit Tag
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-muted-foreground">Loading tag...</span>
          </div>
        ) : (
          <>
            <div className="space-y-5 py-4">
              {/* Tag Info Banner */}
              {originalTag && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Hash className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Tag ID</div>
                        <div className="font-medium">#{originalTag.id}</div>
                      </div>
                    </div>
                    <Badge
                      className={
                        originalTag.reelCount > 0
                          ? "bg-pink-500 hover:bg-pink-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      <Film className="h-3 w-3 mr-1" />
                      {originalTag.reelCount} Reels
                    </Badge>
                  </div>
                </div>
              )}

              {/* Tag Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Tag Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter tag name"
                />
              </div>

              {/* Tag Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-blue-500" />
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
                  URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                </p>
              </div>

              {/* Changes Indicator */}
              {hasChanges && (
                <div className="rounded-lg border border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-600">
                  <span className="font-medium">Unsaved changes</span> - Click "Save Changes" to apply.
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
                disabled={isSubmitting || !formData.name.trim() || !formData.slug.trim() || !hasChanges}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
