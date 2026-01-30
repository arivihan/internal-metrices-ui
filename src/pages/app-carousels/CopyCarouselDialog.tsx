import { useState, useEffect } from "react";
import {
  GitBranch,
  Loader2,
  Images,
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

import { copyCarousel, fetchCarouselById } from "@/services/carousels";
import type {
  CarouselListResponse,
  CopyCarouselItem,
  BatchOption,
} from "@/types/carousels";

interface CopyCarouselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carousels: CarouselListResponse[];
  batches: BatchOption[];
  onSuccess: () => void;
}

interface CarouselWithOrder {
  carousel: CarouselListResponse;
  displayOrder: number;
  linkedBatchIds: number[];
}

interface BatchMappingInfo {
  batchId: number;
  mappedCarouselIds: number[];
}

export function CopyCarouselDialog({
  open,
  onOpenChange,
  carousels,
  batches,
  onSuccess,
}: CopyCarouselDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [carouselsWithOrder, setCarouselsWithOrder] = useState<CarouselWithOrder[]>([]);
  const [batchMappings, setBatchMappings] = useState<BatchMappingInfo[]>([]);
  const [targetBatchId, setTargetBatchId] = useState<number | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Load carousel details to get linked batches for all selected carousels
  useEffect(() => {
    if (open && carousels.length > 0) {
      loadAllCarouselDetails();
      setTargetBatchId(null);
      setExpandedBatchId(null);
      setShowResult(false);
      setResult(null);
    }
  }, [open, carousels]);

  const loadAllCarouselDetails = async () => {
    if (carousels.length === 0) return;

    setIsLoading(true);
    try {
      // Load details for all carousels
      const detailsPromises = carousels.map((c) => fetchCarouselById(c.id));
      const allDetails = await Promise.all(detailsPromises);

      console.log("[MapCarouselDialog] All carousel details:", allDetails);

      // Create carousels with order and linked batch IDs
      const carouselsData: CarouselWithOrder[] = allDetails.map((details, idx) => ({
        carousel: carousels[idx],
        displayOrder: 0,
        linkedBatchIds: details.batches?.map((b) => b.batchId) || [],
      }));

      setCarouselsWithOrder(carouselsData);

      // Build batch mapping info - which carousels are mapped to which batches
      const mappingMap = new Map<number, number[]>();

      carouselsData.forEach((cData) => {
        cData.linkedBatchIds.forEach((batchId) => {
          if (!mappingMap.has(batchId)) {
            mappingMap.set(batchId, []);
          }
          mappingMap.get(batchId)!.push(cData.carousel.id);
        });
      });

      const mappings: BatchMappingInfo[] = Array.from(mappingMap.entries()).map(
        ([batchId, carouselIds]) => ({
          batchId,
          mappedCarouselIds: carouselIds,
        })
      );

      setBatchMappings(mappings);
    } catch (error) {
      console.error("[MapCarouselDialog] Failed to load carousel details:", error);
      toast.error("Failed to load carousel details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleDisplayOrderChange = (carouselId: number, value: string) => {
    const order = parseInt(value) || 0;
    setCarouselsWithOrder((prev) =>
      prev.map((c) =>
        c.carousel.id === carouselId ? { ...c, displayOrder: order } : c
      )
    );
  };

  const toggleExpandBatch = (batchId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId));
  };

  // Check if a batch has any mapped carousels from our selection
  const getBatchMappingInfo = (batchId: number) => {
    const mapping = batchMappings.find((m) => m.batchId === batchId);
    return mapping?.mappedCarouselIds || [];
  };

  const getBatchName = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  const getBatchCode = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch?.code;
  };

  const handleMap = async () => {
    if (carouselsWithOrder.length === 0) {
      toast.error("No carousels selected");
      return;
    }

    if (!targetBatchId) {
      toast.error("Please select a target batch");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build the carousels array - one entry per carousel
      const carouselItems: CopyCarouselItem[] = carouselsWithOrder.map((cData) => ({
        carouselId: cData.carousel.id,
        displayOrder: cData.displayOrder,
        sourceBatchId: cData.linkedBatchIds[0] || 0, // Use first linked batch as source
      }));

      const payload = {
        targetBatchIds: [targetBatchId],
        carousels: carouselItems,
      };

      console.log("[MapCarouselDialog] Mapping carousels with payload:", payload);

      const response = await copyCarousel(payload);

      setResult(response);
      setShowResult(true);

      if (response.message) {
        toast.success(response.message || "Carousels mapped successfully!");
      }
    } catch (error) {
      console.error("[MapCarouselDialog] Map error:", error);
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to map carousels",
      });
      setShowResult(true);
      toast.error(
        error instanceof Error ? error.message : "Failed to map carousels"
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

  if (carousels.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-purple-500" />
            Map Carousels to Batch
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Map {carousels.length} carousel{carousels.length > 1 ? "s" : ""} to a
            target batch
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading carousel details...
            </span>
          </div>
        ) : !showResult ? (
          <div className="flex-1 overflow-y-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-6 pb-4">
              {/* Selected Carousels Section */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Images className="h-4 w-4 text-purple-500" />
                  Selected Carousels ({carouselsWithOrder.length})
                </Label>
                <ScrollArea className="h-40 rounded-md border">
                  <div className="p-3 space-y-2">
                    {carouselsWithOrder.map((cData) => (
                      <div
                        key={cData.carousel.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <div className="h-10 w-14 rounded flex items-center justify-center border overflow-hidden shrink-0">
                          {cData.carousel.url ? (
                            <img
                              src={cData.carousel.url}
                              alt={cData.carousel.carouselCode}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <Images className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {cData.carousel.carouselCode}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {cData.carousel.id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Order:
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={cData.displayOrder}
                            onChange={(e) =>
                              handleDisplayOrderChange(
                                cData.carousel.id,
                                e.target.value
                              )
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
                  Select Target Batch <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Batches already mapped with any selected carousel are disabled.
                </p>

                <ScrollArea className="h-52 rounded-md border">
                  <RadioGroup
                    value={targetBatchId?.toString() || ""}
                    onValueChange={(val) => setTargetBatchId(Number(val))}
                    className="p-3 space-y-2"
                  >
                    {batches.map((batch) => {
                      const mappedCarouselIds = getBatchMappingInfo(batch.id);
                      const hasMappedCarousels = mappedCarouselIds.length > 0;
                      const isAllMapped =
                        mappedCarouselIds.length === carouselsWithOrder.length;
                      const isSelected = targetBatchId === batch.id;
                      const isExpanded = expandedBatchId === batch.id;

                      return (
                        <div
                          key={batch.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? "border-purple-300 bg-purple-50/50"
                              : hasMappedCarousels
                              ? "cursor-not-allowed"
                              : "cursor-pointer hover:border-gray-300"
                          }`}
                          onClick={() =>
                            !hasMappedCarousels && setTargetBatchId(batch.id)
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem
                              value={String(batch.id)}
                              disabled={hasMappedCarousels}
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

                                {/* Mapped indicator */}
                                {hasMappedCarousels && (
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
                                      <>
                                        Mapped ({mappedCarouselIds.length}/
                                        {carouselsWithOrder.length})
                                      </>
                                    )}
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3 ml-1" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                    )}
                                  </Button>
                                )}
                              </div>

                              {/* Expandable mapped carousel IDs */}
                              {hasMappedCarousels && isExpanded && (
                                <div className="mt-2 p-2 rounded border text-xs">
                                  <div className="text-muted-foreground mb-1">
                                    Mapped Carousel IDs:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {mappedCarouselIds.map((carouselId) => {
                                      const carousel = carouselsWithOrder.find(
                                        (c) => c.carousel.id === carouselId
                                      );
                                      return (
                                        <Badge
                                          key={carouselId}
                                          variant="outline"
                                          className="text-[10px]"
                                        >
                                          {carouselId}{" "}
                                          {carousel?.carousel.carouselCode &&
                                            `(${carousel.carousel.carouselCode})`}
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
                    })}
                  </RadioGroup>
                </ScrollArea>

                {targetBatchId && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Target: {getBatchName(targetBatchId)}
                    {getBatchCode(targetBatchId) &&
                      ` (${getBatchCode(targetBatchId)})`}
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
              <h3 className="text-lg text-zinc-700 font-semibold mb-2">
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
                <div>Carousels Mapped:</div>
                <div className="font-medium">{carouselsWithOrder.length}</div>
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
                onClick={handleMap}
                disabled={
                  isSubmitting ||
                  isLoading ||
                  carouselsWithOrder.length === 0 ||
                  !targetBatchId
                }
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                <GitBranch className="mr-2 h-4 w-4" />
                Map {carouselsWithOrder.length} Carousel
                {carouselsWithOrder.length > 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleDone}
              className="bg-purple-500 hover:bg-purple-600"
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
