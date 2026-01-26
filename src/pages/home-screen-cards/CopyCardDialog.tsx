import { useState, useEffect } from "react";
import {
  Copy,
  Loader2,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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

import { copyHomeScreenCard } from "@/services/homeScreenCards";
import type { HomeScreenCardListResponse } from "@/types/homeScreenCards";
import { ICON_MEDIA_TYPES, VISIBILITY_TYPES } from "@/types/homeScreenCards";

interface BatchOption {
  id: number;
  name: string;
  code?: string;
}

interface CopyCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: HomeScreenCardListResponse | null;
  batches: BatchOption[];
  onSuccess: () => void;
}

export function CopyCardDialog({
  open,
  onOpenChange,
  card,
  batches,
  onSuccess,
}: CopyCardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedBatchIds([]);
      setShowResult(false);
      setResult(null);
    }
  }, [open]);

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
      setSelectedBatchIds(batches.map((b) => b.id));
    } else {
      setSelectedBatchIds([]);
    }
  };

  const isAllBatchesSelected =
    batches.length > 0 && selectedBatchIds.length === batches.length;
  const isIndeterminateBatches =
    selectedBatchIds.length > 0 && selectedBatchIds.length < batches.length;

  const handleCopy = async () => {
    if (!card || selectedBatchIds.length === 0) {
      toast.error("Please select at least one target batch");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[CopyCardDialog] Copying card:", {
        cardId: card.id,
        targetBatchIds: selectedBatchIds,
      });

      const response = await copyHomeScreenCard(card.id, {
        targetBatchIds: selectedBatchIds,
      });

      setResult(response);
      setShowResult(true);

      if (response.message) {
        toast.success(response.message || "Card copied successfully!");
      }
    } catch (error) {
      console.error("[CopyCardDialog] Copy error:", error);
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to copy card",
      });
      setShowResult(true);
      toast.error(
        error instanceof Error ? error.message : "Failed to copy card"
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

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-indigo-500" />
            Copy Card to Other Batches
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy "{card.title}" to one or more target batches
          </p>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-6">
            {/* Card Summary */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-indigo-500" />
                Card Details
              </Label>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-lg flex items-center justify-center border"
                    style={{
                      backgroundColor: card.iconBackgroundColor || "#f3f4f6",
                    }}
                  >
                    {card.icon ? (
                      <img
                        src={card.icon}
                        alt={card.title}
                        className="h-8 w-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <LayoutGrid className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{card.title}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {card.id}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {ICON_MEDIA_TYPES[card.iconMediaType] ||
                          card.iconMediaType}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          card.visibilityType === "VISIBLE"
                            ? "bg-green-100 text-green-700 text-xs"
                            : card.visibilityType === "HIDDEN"
                            ? "bg-gray-100 text-gray-600 text-xs"
                            : "bg-yellow-100 text-yellow-700 text-xs"
                        }
                      >
                        {VISIBILITY_TYPES[card.visibilityType] ||
                          card.visibilityType}
                      </Badge>
                      {card.tag && (
                        <Badge
                          style={{
                            backgroundColor:
                              card.tagBackgroundColor || "#e5e7eb",
                            color: "#374151",
                          }}
                          className="text-xs"
                        >
                          {card.tag}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Target Batch Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Select Target Batches
                </Label>
                {batches.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={isAllBatchesSelected}
                      // @ts-ignore
                      indeterminate={isIndeterminateBatches}
                      onCheckedChange={handleSelectAllBatches}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select All
                    </span>
                  </div>
                )}
              </div>

              <ScrollArea className="h-56 rounded-md border">
                <div className="p-3 space-y-2">
                  {batches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No batches available
                    </div>
                  ) : (
                    batches.map((batch) => {
                      const isSelected = selectedBatchIds.includes(batch.id);

                      return (
                        <div
                          key={batch.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-200"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleBatchToggle(batch.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium">{batch.name}</div>
                            {batch.code && (
                              <div className="text-xs text-muted-foreground">
                                Code: {batch.code}
                              </div>
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

              {selectedBatchIds.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-indigo-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {selectedBatchIds.length} batch
                  {selectedBatchIds.length > 1 ? "es" : ""} selected
                </div>
              )}
            </div>
          </div>
        ) : (
          // Result View
          <div className="space-y-4 py-4">
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
                  ? "Copy Successful!"
                  : "Copy Failed"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result?.message || "Operation completed"}
              </p>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <h4 className="font-medium text-sm mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Card Copied:</div>
                <div className="font-medium">{card.title}</div>
                <div>Target Batches:</div>
                <div className="font-medium">{selectedBatchIds.length}</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
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
                onClick={handleCopy}
                disabled={isSubmitting || selectedBatchIds.length === 0}
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                <Copy className="mr-2 h-4 w-4" />
                Copy to {selectedBatchIds.length} Batch
                {selectedBatchIds.length > 1 ? "es" : ""}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleDone}
              className="bg-indigo-500 hover:bg-indigo-600"
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
