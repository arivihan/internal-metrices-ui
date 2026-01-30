import { useState, useEffect } from "react";
import {
  GitBranch,
  Loader2,
  LayoutGrid,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  copyHomeScreenCard,
  fetchHomeScreenCardById,
} from "@/services/homeScreenCards";
import type { HomeScreenCardListResponse, CopyCardItem, HomeScreenCardDetailResponse } from "@/types/homeScreenCards";
import { ICON_MEDIA_TYPES, VISIBILITY_TYPES } from "@/types/homeScreenCards";

interface BatchOption {
  id: number;
  name: string;
  code?: string;
}

interface CopyCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: HomeScreenCardListResponse[];
  batches: BatchOption[];
  onSuccess: () => void;
}

interface CardWithOrder {
  card: HomeScreenCardListResponse;
  displayOrder: number;
  linkedBatchIds: number[];
}

interface BatchMappingInfo {
  batchId: number;
  mappedCardIds: number[];
}

export function CopyCardDialog({
  open,
  onOpenChange,
  cards,
  batches,
  onSuccess,
}: CopyCardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cardsWithOrder, setCardsWithOrder] = useState<CardWithOrder[]>([]);
  const [targetBatchId, setTargetBatchId] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [batchMappingInfo, setBatchMappingInfo] = useState<BatchMappingInfo[]>([]);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());

  // Load card details for all selected cards
  useEffect(() => {
    if (open && cards.length > 0) {
      loadAllCardDetails();
      setTargetBatchId("");
      setShowResult(false);
      setResult(null);
      setExpandedBatches(new Set());
    }
  }, [open, cards]);

  const loadAllCardDetails = async () => {
    if (cards.length === 0) return;

    setIsLoading(true);
    try {
      // Load details for all selected cards in parallel
      const detailsPromises = cards.map((card) => fetchHomeScreenCardById(card.id));
      const allDetails = await Promise.all(detailsPromises);

      console.log("[CopyCardDialog] All card details:", allDetails);

      // Build cards with order and linked batch IDs
      const cardsData: CardWithOrder[] = allDetails.map((details, index) => ({
        card: cards[index],
        displayOrder: 0,
        linkedBatchIds: details.batches?.map((b) => b.batchId) || [],
      }));

      setCardsWithOrder(cardsData);

      // Build batch mapping info
      buildBatchMappingInfo(allDetails);
    } catch (error) {
      console.error("[CopyCardDialog] Failed to load card details:", error);
      toast.error("Failed to load card details");
    } finally {
      setIsLoading(false);
    }
  };

  const buildBatchMappingInfo = (allDetails: HomeScreenCardDetailResponse[]) => {
    const mappingInfo: BatchMappingInfo[] = batches.map((batch) => {
      const mappedCardIds: number[] = [];

      allDetails.forEach((details) => {
        if (details.batches?.some((b) => b.batchId === batch.id)) {
          mappedCardIds.push(details.id);
        }
      });

      return {
        batchId: batch.id,
        mappedCardIds,
      };
    });

    setBatchMappingInfo(mappingInfo);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleDisplayOrderChange = (cardId: number, value: string) => {
    const order = parseInt(value) || 0;
    setCardsWithOrder((prev) =>
      prev.map((c) =>
        c.card.id === cardId ? { ...c, displayOrder: order } : c
      )
    );
  };

  const toggleBatchExpanded = (batchId: number) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const getBatchName = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  const getBatchCode = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch?.code;
  };

  // Check if batch has any of the selected cards mapped
  const isBatchLinked = (batchId: number) => {
    const info = batchMappingInfo.find((b) => b.batchId === batchId);
    return info && info.mappedCardIds.length > 0;
  };

  const getMappingStatus = (batchId: number) => {
    const info = batchMappingInfo.find((b) => b.batchId === batchId);
    if (!info || info.mappedCardIds.length === 0) {
      return null;
    }
    if (info.mappedCardIds.length === cards.length) {
      return "all";
    }
    return `${info.mappedCardIds.length}/${cards.length}`;
  };

  const handleMap = async () => {
    if (cards.length === 0) {
      toast.error("No cards selected");
      return;
    }

    if (!targetBatchId) {
      toast.error("Please select a target batch");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the cards array for all selected cards
      const cardItems: CopyCardItem[] = cardsWithOrder.map((co) => ({
        cardId: co.card.id,
        displayOrder: co.displayOrder,
        sourceBatchId: co.linkedBatchIds[0] || 0, // Use first linked batch as source
      }));

      const payload = {
        targetBatchIds: [Number(targetBatchId)],
        cards: cardItems,
      };

      console.log("[CopyCardDialog] Mapping cards with payload:", payload);

      const response = await copyHomeScreenCard(payload);

      setResult(response);
      setShowResult(true);

      if (response.message) {
        toast.success(response.message || "Cards mapped successfully!");
      }
    } catch (error) {
      console.error("[CopyCardDialog] Map error:", error);
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to map cards",
      });
      setShowResult(true);
      toast.error(
        error instanceof Error ? error.message : "Failed to map cards"
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

  if (cards.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-cyan-500" />
            Map Cards to Batch
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Map {cards.length} card{cards.length > 1 ? "s" : ""} to a target batch
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading card details...
            </span>
          </div>
        ) : !showResult ? (
          <div className="flex-1 overflow-y-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-6 pb-4">
              {/* Selected Cards Section */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-cyan-500" />
                  Selected Cards ({cards.length})
                </Label>
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-3 space-y-2">
                    {cardsWithOrder.map((co) => (
                      <div
                        key={co.card.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center border shrink-0"
                          style={{
                            backgroundColor: co.card.iconBackgroundColor || "#f3f4f6",
                          }}
                        >
                          {co.card.icon ? (
                            <img
                              src={co.card.icon}
                              alt={co.card.title}
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{co.card.title}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {co.card.id} • {co.linkedBatchIds.length} batch{co.linkedBatchIds.length !== 1 ? "es" : ""} linked
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Order:
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={co.displayOrder}
                            onChange={(e) =>
                              handleDisplayOrderChange(co.card.id, e.target.value)
                            }
                            className="w-16 h-8 text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Target Batch Section */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Target Batch <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select a batch to map the cards to. Batches already linked with any selected card are disabled.
                </p>

                {batches.length === 0 ? (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    No batches available.
                  </div>
                ) : (
                  <ScrollArea className="h-56 rounded-md border">
                    <RadioGroup
                      value={targetBatchId}
                      onValueChange={setTargetBatchId}
                      className="p-3 space-y-2"
                    >
                      {batches.map((batch) => {
                        const isLinked = isBatchLinked(batch.id);
                        const mappingStatus = getMappingStatus(batch.id);
                        const isExpanded = expandedBatches.has(batch.id);
                        const info = batchMappingInfo.find((b) => b.batchId === batch.id);

                        return (
                          <div key={batch.id} className="space-y-1">
                            <div
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                isLinked
                                  ? "bg-muted/50 opacity-60 cursor-not-allowed"
                                  : targetBatchId === String(batch.id)
                                  ? " border-cyan-400"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <RadioGroupItem
                                value={String(batch.id)}
                                id={`batch-${batch.id}`}
                                disabled={isLinked}
                              />
                              <label
                                htmlFor={`batch-${batch.id}`}
                                className={`flex-1 cursor-pointer ${
                                  isLinked ? "cursor-not-allowed" : ""
                                }`}
                              >
                                <div className="font-medium text-sm">
                                  {batch.name}
                                  {batch.code && (
                                    <span className="text-muted-foreground ml-1">
                                      ({batch.code})
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Batch ID: {batch.id}
                                </div>
                              </label>
                              {mappingStatus && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleBatchExpanded(batch.id);
                                  }}
                                >
                                  {mappingStatus === "all" ? "All Mapped" : `Mapped (${mappingStatus})`}
                                  {isExpanded ? (
                                    <ChevronUp className="ml-1 h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                            {isExpanded && info && info.mappedCardIds.length > 0 && (
                              <div className="ml-8 p-2 rounded bg-amber-50 border border-amber-100 text-xs text-amber-700">
                                <span className="font-medium">Mapped Card IDs:</span>{" "}
                                {info.mappedCardIds.join(", ")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </ScrollArea>
                )}

                {targetBatchId && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Target: {getBatchName(Number(targetBatchId))}
                    {getBatchCode(Number(targetBatchId)) && (
                      <span className="text-muted-foreground">
                        ({getBatchCode(Number(targetBatchId))})
                      </span>
                    )}
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
              <h3 className="text-lg text-zinc-900 font-semibold mb-2">
                {result?.success ||
                result?.message?.toLowerCase().includes("success")
                  ? "Mapping Successful!"
                  : "Mapping Failed"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {result?.message || "Operation completed"}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium text-sm mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cards Mapped:</div>
                <div className="font-medium">{cards.length}</div>
                <div>Target Batch:</div>
                <div className="font-medium">
                  {targetBatchId ? getBatchName(Number(targetBatchId)) : "-"}
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
                onClick={handleMap}
                disabled={
                  isSubmitting ||
                  isLoading ||
                  !targetBatchId ||
                  cards.length === 0
                }
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                <GitBranch className="mr-2 h-4 w-4" />
                Map {cards.length} Card{cards.length > 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleDone}
              className="bg-cyan-500 hover:bg-cyan-600"
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
