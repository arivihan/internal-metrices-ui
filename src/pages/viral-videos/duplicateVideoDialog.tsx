

import { useState, useEffect } from "react";
import { Copy, Loader2, Video, CheckCircle2, AlertCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Load batch options when dialog opens
  useEffect(() => {
    if (open) {
      loadBatchOptions();
      setSelectedBatchIds([]);
      setShowResult(false);
      setResult(null);
    }
  }, [open]);

  const loadBatchOptions = async () => {
    setLoading(true);
    try {
      console.log("[DuplicateVideoDialog] Loading batch options...");
      const batchesRes = await fetchAllBatchesForVideos({ activeFlag: true });
      console.log("[DuplicateVideoDialog] Batch options loaded:", batchesRes);
      setBatches(batchesRes);
    } catch (error) {
      console.error(
        "[DuplicateVideoDialog] Failed to load batch options:",
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

  const handleBatchToggle = (batchId: number, checked: boolean) => {
    if (checked) {
      setSelectedBatchIds((prev) => [...prev, batchId]);
    } else {
      setSelectedBatchIds((prev) => prev.filter((id) => id !== batchId));
    }
  };

  const handleSelectAllBatches = (checked: boolean) => {
    if (checked) {
      // Select all except source batches
      const selectableBatches = batches
        .filter((b) => !sourceBatches.includes(b.id))
        .map((b) => b.id);
      setSelectedBatchIds(selectableBatches);
    } else {
      setSelectedBatchIds([]);
    }
  };

  // Get unique source batches from selected videos
  const sourceBatches = Array.from(
    new Set(selectedVideos.flatMap((video) => video.batches?.map((b) => b.batchId) || []))
  );

  // Filter out source batches from selectable batches
  const selectableBatches = batches.filter(
    (b) => !sourceBatches.includes(b.id)
  );

  const isAllBatchesSelected =
    selectableBatches.length > 0 &&
    selectedBatchIds.length === selectableBatches.length;
  const isIndeterminateBatches =
    selectedBatchIds.length > 0 &&
    selectedBatchIds.length < selectableBatches.length;

  const handleDuplicate = async () => {
    if (selectedBatchIds.length === 0) {
      toast.error("Please select at least one target batch");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the map request payload according to API spec
      // API expects: { selectedVideos: [{ videoId: number, displayOrder: number }], targetBatchIds: [...] }
      const mapRequest: MapVideoRequest = {
        selectedVideos: selectedVideos.map((video) => ({
          videoId: Number(video.id),
          displayOrder: video.displayOrder,
        })),
        targetBatchIds: selectedBatchIds,
      };

      console.log(
        "[DuplicateVideoDialog] Mapping videos:",
        mapRequest
      );

      const response = await mapViralVideos(mapRequest);

      setResult(response);
      setShowResult(true);

      if (response.success || response.message) {
        toast.success(response.message || "Videos successfully mapped");
      }
    } catch (error) {
      console.error("[DuplicateVideoDialog] Mapping error:", error);
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to map videos",
      });
      setShowResult(true);
      toast.error(
        error instanceof Error ? error.message : "Failed to map videos"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    if (result?.success || result?.message?.toLowerCase().includes("success")) {
      onSuccess();
    }
    handleClose();
  };

  const getVideoTypeDisplay = (type: string) => {
    return VIDEO_TYPES[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-rose-500" />
            Duplicate Videos to Other Batches
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy {selectedVideos.length} selected video
            {selectedVideos.length > 1 ? "s" : ""} to one or more target batches
          </p>
        </DialogHeader>

        {!showResult ? (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Selected Videos Summary */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <Video className="h-4 w-4 text-rose-500" />
                Selected Videos ({selectedVideos.length})
              </Label>
              <ScrollArea className="h-40 rounded-md border bg-muted/30">
                <div className="p-3 space-y-2">
                  {selectedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background border"
                    >
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.code}
                          loading="lazy"
                          className="h-12 w-9 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`h-12 w-9 flex items-center justify-center bg-muted rounded ${video.thumbnailUrl ? "hidden" : ""}`}>
                        <Video className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {video.code}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getVideoTypeDisplay(video.type)} • Order #
                          {video.displayOrder}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {video.batches?.length > 0
                          ? video.batches.map(b => b.batchName).join(", ")
                          : "-"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                Source batches ({sourceBatches.join(", ")}) are excluded from
                target selection
              </div>
            </div>

            <Separator />

            {/* Target Batch Selection */}
            <div className="space-y-3 ">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Select Target Batches
                </Label>
                {selectableBatches.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isAllBatchesSelected}
                      // @ts-ignore
                      indeterminate={isIndeterminateBatches}
                      onCheckedChange={handleSelectAllBatches}
                      disabled={loading}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select All
                    </span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading batches...
                  </span>
                </div>
              ) : (
                <ScrollArea className="h-56 rounded-md border">
                  <div className="p-3 space-y-2">
                    {batches.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No batches available
                      </div>
                    ) : (
                      batches.map((batch) => {
                        const isSourceBatch = sourceBatches.includes(batch.id);
                        const isSelected = selectedBatchIds.includes(batch.id);

                        return (
                          <div
                            key={batch.id}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                              isSourceBatch
                               
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleBatchToggle(batch.id, checked as boolean)
                              }
                              disabled={isSourceBatch}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{batch.name}</div>
                              {batch.examName && batch.gradeName && (
                                <div className="text-xs text-muted-foreground">
                                  {batch.examName} • {batch.gradeName} •{" "}
                                  {batch.language}
                                </div>
                              )}
                              {isSourceBatch && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs mt-1"
                                >
                                  Source Batch
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              ID: {batch.id}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              )}

              {selectedBatchIds.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-rose-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {selectedBatchIds.length} batch
                  {selectedBatchIds.length > 1 ? "es" : ""} selected
                </div>
              )}
            </div>
          </div>
        ) : (
          // Result View
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div
              className={`rounded-lg border p-6 text-center ${
                result?.success ||
                result?.message?.toLowerCase().includes("success")
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {result?.success ||
              result?.message?.toLowerCase().includes("success") ? (
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              ) : (
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              )}
              <h3 className="text-lg font-semibold mb-2">
                {result?.success ||
                result?.message?.toLowerCase().includes("success")
                  ? "Duplication Successful!"
                  : "Duplication Failed"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result?.message || "Operation completed"}
              </p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <h4 className="font-medium text-sm mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Videos Duplicated:</div>
                <div className="font-medium">{selectedVideos.length}</div>
                <div>Target Batches:</div>
                <div className="font-medium">{selectedBatchIds.length}</div>
                <div>Total Copies Created:</div>
                <div className="font-medium">
                  {selectedVideos.length * selectedBatchIds.length}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t pt-4">
          {!showResult ? (
            <>
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
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                <Copy className="mr-2 h-4 w-4" />
                Duplicate to {selectedBatchIds.length} Batch
                {selectedBatchIds.length > 1 ? "es" : ""}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleDone}
              className="bg-rose-500 hover:bg-rose-600"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
