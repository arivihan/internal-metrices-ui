import { useState, useEffect } from "react";
import { Copy, Loader2, Video, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [videoFormData, setVideoFormData] = useState<VideoFormData[]>([]);
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);

  // Get video IDs that are mapped to a specific batch
  const getVideoIdsMappedToBatch = (batchId: number): string[] => {
    return selectedVideos
      .filter((video) => video.batches?.some((b) => b.batchId === batchId))
      .map((video) => video.id);
  };

  // Check if ANY selected video is mapped to a batch
  const isAnyVideoMappedToBatch = (batchId: number): boolean => {
    return getVideoIdsMappedToBatch(batchId).length > 0;
  };

  // Check if ALL selected videos are mapped to a batch
  const isAllVideosMappedToBatch = (batchId: number): boolean => {
    const mappedVideoIds = getVideoIdsMappedToBatch(batchId);
    return mappedVideoIds.length === selectedVideos.length;
  };

  // Load batch options when dialog opens
  useEffect(() => {
    if (open) {
      loadBatchOptions();
      setSelectedBatchId(null);
      setExpandedBatchId(null);
      // Initialize video form data with display orders
      const initialFormData: VideoFormData[] = selectedVideos.map((video) => ({
        videoId: video.id,
        displayOrder: video.displayOrder ?? 0,
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

  const handleDisplayOrderChange = (videoId: string, value: number) => {
    setVideoFormData((prev) =>
      prev.map((item) =>
        item.videoId === videoId ? { ...item, displayOrder: value } : item
      )
    );
  };

  const handleDuplicate = async () => {
    if (!selectedBatchId) {
      toast.error("Please select a target batch");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the request - for each video, find its source batch (first available batch)
      const videosPayload = selectedVideos.map((video) => {
        const formData = videoFormData.find((v) => v.videoId === video.id);
        // Use the first batch as source batch
        const sourceBatchId = video.batches?.[0]?.batchId;

        if (!sourceBatchId) {
          throw new Error(`Video ${video.code} has no source batch`);
        }

        return {
          videoId: Number(video.id),
          displayOrder: formData?.displayOrder ?? video.displayOrder ?? 0,
          sourceBatchId: sourceBatchId,
        };
      });

      const mapRequest: MapVideoRequest = {
        targetBatchIds: [selectedBatchId],
        selectedVideos: videosPayload,
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

  const getVideoFormDataItem = (videoId: string) => {
    return videoFormData.find((v) => v.videoId === videoId);
  };

  // Count available batches (not mapped with any video)
  const availableBatchesCount = batches.filter(
    (b) => !isAnyVideoMappedToBatch(b.id)
  ).length;

  const toggleExpandBatch = (batchId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-rose-500" />
            Duplicate Videos to Batch
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy {selectedVideos.length} selected video
            {selectedVideos.length > 1 ? "s" : ""} to a target batch
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-6 pb-4">
            {/* Selected Videos Section */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Video className="h-4 w-4 text-rose-500" />
                Selected Videos ({selectedVideos.length})
              </Label>
              <ScrollArea className="h-44 rounded-md border">
                <div className="p-3 space-y-2">
                  {selectedVideos.map((video) => {
                    const formData = getVideoFormDataItem(video.id);
                    const mappedBatches = video.batches || [];

                    return (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{video.code}</span>
                            <Badge variant="outline" className="text-xs">
                              ID: {video.id}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getVideoTypeDisplay(video.type)}
                            {mappedBatches.length > 0 && (
                              <span className="ml-2">
                                • Mapped to {mappedBatches.length} batch
                                {mappedBatches.length > 1 ? "es" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Display Order */}
                        <div className="flex items-center gap-2">
                          <Label className="text-xs whitespace-nowrap">Order:</Label>
                          <Input
                            type="number"
                            value={formData?.displayOrder ?? 0}
                            onChange={(e) =>
                              handleDisplayOrderChange(video.id, parseInt(e.target.value) || 0)
                            }
                            className="w-20 h-8 text-center"
                            min={0}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Target Batch Selection - Single Select */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Select Target Batch <span className="text-destructive">*</span>
                </Label>
                <span className="text-sm text-muted-foreground">
                  {availableBatchesCount} available
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Select one batch to copy videos to. Batches with any mapped videos are disabled.
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading batches...
                  </span>
                </div>
              ) : (
                <ScrollArea className="h-56 rounded-md border">
                  <RadioGroup
                    value={selectedBatchId?.toString() || ""}
                    onValueChange={(val) => setSelectedBatchId(Number(val))}
                    className="p-3 space-y-2"
                  >
                    {batches.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No batches available
                      </div>
                    ) : (
                      batches.map((batch) => {
                        const mappedVideoIds = getVideoIdsMappedToBatch(batch.id);
                        const hasMappedVideos = mappedVideoIds.length > 0;
                        const isAllMapped = isAllVideosMappedToBatch(batch.id);
                        const isSelected = selectedBatchId === batch.id;
                        const isExpanded = expandedBatchId === batch.id;

                        return (
                          <div
                            key={batch.id}
                            className={`p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? ""
                                : hasMappedVideos
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            onClick={() => !hasMappedVideos && setSelectedBatchId(batch.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem
                                value={String(batch.id)}
                                disabled={hasMappedVideos}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{batch.name}</span>
                                    {batch.code && (
                                      <Badge variant="outline" className="text-xs">
                                        {batch.code}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Mapped indicator - positioned on right */}
                                  {hasMappedVideos && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={`h-7 text-xs ${
                                        isAllMapped
                                          ? "text-green-700 hover:text-green-800 hover:bg-green-50"
                                          : "text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                      }`}
                                      onClick={(e) => toggleExpandBatch(batch.id, e)}
                                    >
                                      {isAllMapped ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          All Mapped
                                        </>
                                      ) : (
                                        <>Mapped ({mappedVideoIds.length}/{selectedVideos.length})</>
                                      )}
                                      {isExpanded ? (
                                        <ChevronUp className="h-3 w-3 ml-1" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                      )}
                                    </Button>
                                  )}
                                </div>

                                {/* Expandable mapped video IDs */}
                                {hasMappedVideos && isExpanded && (
                                  <div className="mt-2 p-2 rounded border text-xs">
                                    <div className="text-muted-foreground mb-1">
                                      Mapped Video IDs:
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {mappedVideoIds.map((videoId) => {
                                        const video = selectedVideos.find((v) => v.id === videoId);
                                        return (
                                          <Badge
                                            key={videoId}
                                            variant="outline"
                                            className="text-[10px]"
                                          >
                                            {videoId} {video?.code && `(${video.code})`}
                                          </Badge>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </RadioGroup>
                </ScrollArea>
              )}

              {selectedBatchId && (
                <div className="flex items-center gap-2 text-sm text-rose-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Target: {batches.find((b) => b.id === selectedBatchId)?.name}
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
            disabled={isSubmitting || !selectedBatchId}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Videos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
