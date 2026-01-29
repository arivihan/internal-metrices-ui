import { useState, useEffect } from "react";
import { Copy, Loader2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  mapViralVideos,
  fetchAllBatchesForVideos,
} from "@/services/viralVideos";
import type {
  VideoResponseDto,
  BatchOption,
  MapVideoRequest,
} from "@/types/viralVideos";
import { VIDEO_TYPES } from "@/types/viralVideos";

interface DuplicateVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVideos: VideoResponseDto[];
  onSuccess: () => void;
}

interface VideoFormData {
  videoId: string;
  displayOrder: number;
  sourceBatchId: number | null;
}

export function DuplicateVideoDialog({
  open,
  onOpenChange,
  selectedVideos,
  onSuccess,
}: DuplicateVideoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [videoFormData, setVideoFormData] = useState<VideoFormData[]>([]);

  // Get all batch IDs where ALL selected videos are already mapped
  const getCommonMappedBatchIds = () => {
    if (selectedVideos.length === 0) return [];

    // Get batch IDs that are mapped for ALL selected videos
    const allBatchSets = selectedVideos.map(
      (video) => new Set(video.batches?.map((b) => b.batchId) || [])
    );

    if (allBatchSets.length === 0) return [];

    // Find intersection of all sets
    const firstSet = allBatchSets[0];
    const commonBatchIds = [...firstSet].filter((batchId) =>
      allBatchSets.every((set) => set.has(batchId))
    );

    return commonBatchIds;
  };

  const commonMappedBatchIds = getCommonMappedBatchIds();

  // Check if a batch is mapped for ALL selected videos
  const isBatchMappedForAll = (batchId: number) => commonMappedBatchIds.includes(batchId);

  // Load batch options when dialog opens
  useEffect(() => {
    if (open) {
      loadBatchOptions();
      setSelectedBatchIds([]);
      // Initialize video form data
      const initialFormData: VideoFormData[] = selectedVideos.map((video) => ({
        videoId: video.id,
        displayOrder: video.displayOrder ?? 0,
        // Auto-select first batch as source if available
        sourceBatchId: video.batches?.[0]?.batchId ?? null,
      }));
      setVideoFormData(initialFormData);
    }
  }, [open, selectedVideos]);

  const loadBatchOptions = async () => {
    setLoading(true);
    try {
      const batchesRes = await fetchAllBatchesForVideos({ activeFlag: true });
      setBatches(batchesRes);
    } catch (error) {
      console.error("[DuplicateVideoDialog] Failed to load batch options:", error);
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

  const handleBatchToggle = (batchId: number, checked: boolean) => {
    if (checked) {
      setSelectedBatchIds((prev) => [...prev, batchId]);
    } else {
      setSelectedBatchIds((prev) => prev.filter((id) => id !== batchId));
    }
  };

  const handleDisplayOrderChange = (videoId: string, value: number) => {
    setVideoFormData((prev) =>
      prev.map((item) =>
        item.videoId === videoId ? { ...item, displayOrder: value } : item
      )
    );
  };

  const handleSourceBatchChange = (videoId: string, batchId: number) => {
    setVideoFormData((prev) =>
      prev.map((item) =>
        item.videoId === videoId ? { ...item, sourceBatchId: batchId } : item
      )
    );
  };

  // Get available batches for target selection (exclude common mapped batches)
  const availableTargetBatches = batches.filter((b) => !isBatchMappedForAll(b.id));

  const handleSelectAllBatches = (checked: boolean) => {
    if (checked) {
      setSelectedBatchIds(availableTargetBatches.map((b) => b.id));
    } else {
      setSelectedBatchIds([]);
    }
  };

  const isAllBatchesSelected =
    availableTargetBatches.length > 0 &&
    selectedBatchIds.length === availableTargetBatches.length;

  const handleDuplicate = async () => {
    if (selectedBatchIds.length === 0) {
      toast.error("Please select at least one target batch");
      return;
    }

    // Validate all videos have source batch selected
    const missingSourceBatch = videoFormData.find((v) => !v.sourceBatchId);
    if (missingSourceBatch) {
      const video = selectedVideos.find((v) => v.id === missingSourceBatch.videoId);
      toast.error(`Please select source batch for video: ${video?.code || missingSourceBatch.videoId}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const mapRequest: MapVideoRequest = {
        targetBatchIds: selectedBatchIds,
        videos: videoFormData.map((item) => ({
          videoId: Number(item.videoId),
          displayOrder: item.displayOrder,
          sourceBatchId: item.sourceBatchId!,
        })),
      };

      console.log("[DuplicateVideoDialog] Map request:", mapRequest);

      const response = await mapViralVideos(mapRequest);

      if (response.success || response.message) {
        toast.success(response.message || "Videos successfully mapped");
        onSuccess();
        handleClose();
      } else {
        toast.error(response.message || "Failed to duplicate videos");
      }
    } catch (error) {
      console.error("[DuplicateVideoDialog] Duplication error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to duplicate videos"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVideoTypeDisplay = (type: string) => {
    return VIDEO_TYPES[type] || type;
  };

  const getVideoFormData = (videoId: string) => {
    return videoFormData.find((v) => v.videoId === videoId);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-rose-500" />
            Duplicate Videos to Other Batches
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy {selectedVideos.length} selected video
            {selectedVideos.length > 1 ? "s" : ""} to target batches
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-6 pb-4">
            {/* Selected Videos with Source Batch Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Selected Videos ({selectedVideos.length})
              </Label>
              <ScrollArea className="h-52 rounded-md border p-3">
                <div className="space-y-3">
                  {selectedVideos.map((video) => {
                    const formData = getVideoFormData(video.id);
                    const videoBatches = video.batches || [];

                    return (
                      <div
                        key={video.id}
                        className="flex items-center gap-4 text-sm border-b pb-3 last:border-b-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{video.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {getVideoTypeDisplay(video.type)}
                          </div>
                        </div>

                        {/* Source Batch Selection */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs whitespace-nowrap">Source:</Label>
                          <Select
                            value={formData?.sourceBatchId?.toString() || ""}
                            onValueChange={(val) => handleSourceBatchChange(video.id, Number(val))}
                          >
                            <SelectTrigger className="w-36 h-8 text-xs">
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {videoBatches.length === 0 ? (
                                <SelectItem value="" disabled>
                                  No batches
                                </SelectItem>
                              ) : (
                                videoBatches.map((batch) => (
                                  <SelectItem key={batch.batchId} value={String(batch.batchId)}>
                                    {batch.batchName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Display Order */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs whitespace-nowrap">Order:</Label>
                          <Input
                            type="number"
                            value={formData?.displayOrder ?? video.displayOrder ?? 0}
                            onChange={(e) =>
                              handleDisplayOrderChange(video.id, parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-8 text-sm"
                            min={0}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Target Batch Selection - Multi-select */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Select Target Batches
                </Label>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {availableTargetBatches.length} available
                  </span>
                  {availableTargetBatches.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isAllBatchesSelected}
                        onCheckedChange={handleSelectAllBatches}
                      />
                      <span className="text-xs text-muted-foreground">Select All</span>
                    </div>
                  )}
                </div>
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
                  <div className="space-y-2">
                    {batches.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No batches available
                      </div>
                    ) : (
                      batches.map((batch) => {
                        const isMapped = isBatchMappedForAll(batch.id);
                        const isSelected = selectedBatchIds.includes(batch.id);

                        return (
                          <div
                            key={batch.id}
                            className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-accent ${
                              isSelected ? "bg-accent" : ""
                            } ${isMapped ? "opacity-50" : ""}`}
                            onClick={() => !isMapped && handleBatchToggle(batch.id, !isSelected)}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleBatchToggle(batch.id, checked as boolean)}
                              disabled={isMapped}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{batch.name}</span>
                                {isMapped && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    Already Mapped
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
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              )}

              {selectedBatchIds.length > 0 && (
                <div className="text-sm text-rose-600">
                  {selectedBatchIds.length} batch{selectedBatchIds.length > 1 ? "es" : ""} selected
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
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
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Copy className="mr-2 h-4 w-4" />
            Duplicate to {selectedBatchIds.length || 0} Batch{selectedBatchIds.length !== 1 ? "es" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
