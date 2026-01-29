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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  copyHomeScreenCard,
  fetchHomeScreenCardById,
} from "@/services/homeScreenCards";
import type { HomeScreenCardListResponse, CopyCardItem } from "@/types/homeScreenCards";
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

interface SourceBatchItem {
  batchId: number;
  batchCode?: string;
  displayOrder: number;
  selected: boolean;
}

export function CopyCardDialog({
  open,
  onOpenChange,
  card,
  batches,
  onSuccess,
}: CopyCardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceBatches, setSourceBatches] = useState<SourceBatchItem[]>([]);
  const [targetBatchId, setTargetBatchId] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Load card details to get source batches
  useEffect(() => {
    if (open && card) {
      loadCardDetails();
      setTargetBatchId(null);
      setShowResult(false);
      setResult(null);
    }
  }, [open, card]);

  const loadCardDetails = async () => {
    if (!card) return;

    setIsLoading(true);
    try {
      const details = await fetchHomeScreenCardById(card.id);
      console.log("[CopyCardDialog] Card details:", details);

      if (details.batches && details.batches.length > 0) {
        setSourceBatches(
          details.batches.map((b) => ({
            batchId: b.batchId,
            batchCode: b.batchCode,
            displayOrder: b.displayOrder || 0,
            selected: false,
          }))
        );
      } else {
        setSourceBatches([]);
      }
    } catch (error) {
      console.error("[CopyCardDialog] Failed to load card details:", error);
      toast.error("Failed to load card details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleSourceBatchToggle = (batchId: number, checked: boolean) => {
    setSourceBatches((prev) =>
      prev.map((b) =>
        b.batchId === batchId ? { ...b, selected: checked } : b
      )
    );
  };

  const handleDisplayOrderChange = (batchId: number, value: string) => {
    const order = parseInt(value) || 0;
    setSourceBatches((prev) =>
      prev.map((b) =>
        b.batchId === batchId ? { ...b, displayOrder: order } : b
      )
    );
  };

  const handleSelectAllSourceBatches = (checked: boolean) => {
    setSourceBatches((prev) =>
      prev.map((b) => ({ ...b, selected: checked }))
    );
  };

  const selectedSourceBatches = sourceBatches.filter((b) => b.selected);
  const isAllSourceSelected =
    sourceBatches.length > 0 && selectedSourceBatches.length === sourceBatches.length;
  const isIndeterminateSource =
    selectedSourceBatches.length > 0 &&
    selectedSourceBatches.length < sourceBatches.length;

  // Filter out batches that are already associated with this card for target selection
  const availableTargetBatches = batches.filter(
    (b) => !sourceBatches.some((sb) => sb.batchId === b.id)
  );

  const handleCopy = async () => {
    if (!card) {
      toast.error("No card selected");
      return;
    }

    if (selectedSourceBatches.length === 0) {
      toast.error("Please select at least one source batch");
      return;
    }

    if (!targetBatchId) {
      toast.error("Please select a target batch");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the cards array from selected source batches
      const cards: CopyCardItem[] = selectedSourceBatches.map((sb) => ({
        cardId: card.id,
        displayOrder: sb.displayOrder,
        sourceBatchId: sb.batchId,
      }));

      const payload = {
        targetBatchIds: [targetBatchId],
        cards,
      };

      console.log("[CopyCardDialog] Copying card with payload:", payload);

      const response = await copyHomeScreenCard(payload);

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

  const getBatchName = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-indigo-500" />
            Copy Card to Other Batches
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copy "{card.title}" to a target batch
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading card details...
            </span>
          </div>
        ) : !showResult ? (
          <div className="flex-1 overflow-y-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-6 pb-4">
              {/* Card Details */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-indigo-500" />
                  Card Details
                </Label>
                <div className="rounded-lg border p-4">
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
                        Card ID: {card.id}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ICON_MEDIA_TYPES[card.iconMediaType] ||
                            card.iconMediaType}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={
                            card.visibilityType === "ALL"
                              ? "bg-green-100 text-green-700 text-xs"
                              : card.visibilityType === "SUBSCRIBED"
                              ? "bg-blue-100 text-blue-700 text-xs"
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

              {/* Source Batches Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Source Batches <span className="text-destructive">*</span>
                  </Label>
                  {sourceBatches.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isAllSourceSelected}
                        // @ts-ignore
                        indeterminate={isIndeterminateSource}
                        onCheckedChange={handleSelectAllSourceBatches}
                      />
                      <span className="text-sm text-muted-foreground">
                        Select All
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select source batches to copy from. You can edit the display order for each.
                </p>

                {sourceBatches.length === 0 ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    This card has no batch configurations to copy from.
                  </div>
                ) : (
                  <ScrollArea className="h-44 rounded-md border">
                    <div className="p-3 space-y-2">
                      {sourceBatches.map((sb) => (
                        <div
                          key={sb.batchId}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                            sb.selected
                              ? "bg-indigo-50 border-indigo-200"
                              : ""
                          }`}
                        >
                          <Checkbox
                            checked={sb.selected}
                            onCheckedChange={(checked) =>
                              handleSourceBatchToggle(sb.batchId, checked as boolean)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {getBatchName(sb.batchId)}
                            </div>
                            {sb.batchCode && (
                              <div className="text-xs text-muted-foreground">
                                Code: {sb.batchCode}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Display Order:
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={sb.displayOrder}
                              onChange={(e) =>
                                handleDisplayOrderChange(sb.batchId, e.target.value)
                              }
                              className="w-20 h-8 text-center"
                            />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ID: {sb.batchId}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {selectedSourceBatches.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedSourceBatches.length} source batch
                    {selectedSourceBatches.length > 1 ? "es" : ""} selected
                  </div>
                )}
              </div>

              <Separator />

              {/* Target Batch Section */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Target Batch <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select a single batch to copy the card configuration to.
                </p>

                {availableTargetBatches.length === 0 ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    No additional batches available to copy to.
                  </div>
                ) : (
                  <Select
                    value={targetBatchId?.toString() || ""}
                    onValueChange={(val) => setTargetBatchId(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTargetBatches.map((batch) => (
                        <SelectItem key={batch.id} value={String(batch.id)}>
                          {batch.name}
                          {batch.code && ` (${batch.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {targetBatchId && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Target: {getBatchName(targetBatchId)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Result View
          <div className="space-y-4 py-4 px-6">
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

            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-sm mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Card Copied:</div>
                <div className="font-medium">{card.title}</div>
                <div>Source Batches:</div>
                <div className="font-medium">{selectedSourceBatches.length}</div>
                <div>Target Batch:</div>
                <div className="font-medium">
                  {targetBatchId ? getBatchName(targetBatchId) : "-"}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          {!showResult ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCopy}
                disabled={
                  isSubmitting ||
                  isLoading ||
                  selectedSourceBatches.length === 0 ||
                  !targetBatchId ||
                  sourceBatches.length === 0
                }
                className="bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                <Copy className="mr-2 h-4 w-4" />
                Copy {selectedSourceBatches.length} Config
                {selectedSourceBatches.length > 1 ? "s" : ""}
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
