import { useState, useEffect } from "react";
import {
  Loader2,
  Video,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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

import {
  createVideo,
  fetchAllBatchesForVideos,
} from "@/services/viralVideos";
import type { BatchOption, VideoRequest } from "@/types/viralVideos";
import { VIDEO_TYPES, VIDEO_ORIENTATIONS, DISPLAY_CONTEXTS } from "@/types/viralVideos";

interface UploadVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData extends VideoRequest {
  batchId: number | null;
}

export function UploadVideoDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadVideoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    code: "",
    url: "",
    thumbnailUrl: "",
    orientation: "PORTRAIT",
    context: "HOMESCREEN",
    type: "VIRAL_VIDEOS",
    position: 0,
    isActive: true,
    batchId: null,
  });

  // Batch options
  const [batches, setBatches] = useState<BatchOption[]>([]);

  // Load batch options
  useEffect(() => {
    if (open) {
      loadBatchOptions();
      // Reset form when dialog opens
      setFormData({
        code: "",
        url: "",
        thumbnailUrl: "",
        orientation: "PORTRAIT",
        context: "HOMESCREEN",
        type: "VIRAL_VIDEOS",
        position: 0,
        isActive: true,
        batchId: null,
      });
    }
  }, [open]);

  const loadBatchOptions = async () => {
    setLoading(true);
    try {
      console.log("[UploadVideoDialog] Loading batch options...");
      const batchesRes = await fetchAllBatchesForVideos({ activeFlag: true });
      console.log("[UploadVideoDialog] Batch options loaded:", batchesRes);
      setBatches(batchesRes);

      if (batchesRes.length === 0) {
        toast.warning("No active batches found");
      }
    } catch (error) {
      console.error("[UploadVideoDialog] Failed to load batch options:", error);
      toast.error(
        "Failed to load batch options: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
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

  const validateForm = (): boolean => {
    if (!formData.url?.trim()) {
      toast.error("Please enter a video URL");
      return false;
    }

    if (!formData.batchId) {
      toast.error("Please select a batch");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const videoRequest: VideoRequest = {
        code: formData.code || undefined,
        url: formData.url,
        thumbnailUrl: formData.thumbnailUrl || undefined,
        orientation: formData.orientation,
        context: formData.context,
        type: formData.type,
        position: formData.position,
        isActive: formData.isActive,
      };

      console.log("[UploadVideoDialog] Creating video:", videoRequest);

      await createVideo(videoRequest, formData.batchId!);

      toast.success("Video created successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("[UploadVideoDialog] Create error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create video"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-rose-500" />
            Create New Video
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Batch Selection */}
          <div className="space-y-2">
            <Label htmlFor="batch">
              Select Batch <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.batchId?.toString() || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  batchId: value ? Number(value) : null,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger id="batch">
                <SelectValue placeholder="Choose a batch for this video" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={String(batch.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{batch.name}</span>
                      {batch.examName && batch.gradeName && (
                        <span className="text-xs text-muted-foreground">
                          {batch.examName} • {batch.gradeName} • {batch.language}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Video Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Video Code</Label>
            <Input
              id="code"
              placeholder="e.g., video-test-001 (auto-generated if empty)"
              value={formData.code || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <Label htmlFor="url">
              Video URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              placeholder="https://example.com/video.mp4"
              value={formData.url || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              placeholder="https://example.com/thumbnail.jpg"
              value={formData.thumbnailUrl || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
              }
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Video Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Video Type</Label>
              <Select
                value={formData.type || "VIRAL_VIDEOS"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VIDEO_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                  <SelectItem value="VIRAL_VIDEOS">Viral Videos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={formData.orientation || "PORTRAIT"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, orientation: value }))
                }
              >
                <SelectTrigger id="orientation">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VIDEO_ORIENTATIONS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Display Context */}
            <div className="space-y-2">
              <Label htmlFor="context">Display Context</Label>
              <Select
                value={formData.context || "HOMESCREEN"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, context: value }))
                }
              >
                <SelectTrigger id="context">
                  <SelectValue placeholder="Select context" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISPLAY_CONTEXTS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                type="number"
                min={0}
                placeholder="0"
                value={formData.position ?? 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    position: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-base">
                Active Status
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable to make the video visible to users
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive ?? true}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          {/* Preview Card */}
          {formData.thumbnailUrl && (
            <div className="rounded-lg border p-4 bg-muted/30">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Preview
              </Label>
              <div className="flex items-start gap-4">
                <img
                  src={formData.thumbnailUrl}
                  alt="Video thumbnail preview"
                  className="h-20 w-14 object-cover rounded-md border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {formData.code || "New Video"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {formData.url || "No URL provided"}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded">
                      {formData.type || "VIRAL_VIDEOS"}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                      {formData.orientation || "PORTRAIT"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.url?.trim() || !formData.batchId}
            className="bg-rose-500 hover:bg-rose-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                Create Video
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
