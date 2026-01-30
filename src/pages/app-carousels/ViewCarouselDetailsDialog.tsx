import { useState, useEffect } from "react";
import { Loader2, Images, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { fetchCarouselById } from "@/services/carousels";
import type { CarouselDetailResponse } from "@/types/carousels";
import { VISIBILITY_TYPES, NAVIGATION_TYPES } from "@/types/carousels";

interface ViewCarouselDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carouselId: number | null;
}

export function ViewCarouselDetailsDialog({
  open,
  onOpenChange,
  carouselId,
}: ViewCarouselDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [carouselDetails, setCarouselDetails] = useState<CarouselDetailResponse | null>(null);

  useEffect(() => {
    if (open && carouselId) {
      loadCarouselDetails();
    } else {
      setCarouselDetails(null);
    }
  }, [open, carouselId]);

  const loadCarouselDetails = async () => {
    if (!carouselId) return;

    setLoading(true);
    try {
      const details = await fetchCarouselById(carouselId);
      console.log("[ViewCarouselDetailsDialog] Carousel details:", details);
      setCarouselDetails(details);
    } catch (error) {
      console.error("[ViewCarouselDetailsDialog] Failed to load carousel details:", error);
      toast.error("Failed to load carousel details");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-purple-500" />
            Carousel Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading carousel details...
            </span>
          </div>
        ) : carouselDetails ? (
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-6">
              {/* Carousel Header */}
              <div className="flex items-start gap-4">
                <div className="h-20 w-32 rounded-lg flex items-center justify-center border shrink-0 overflow-hidden bg-gray-50">
                  {carouselDetails.url ? (
                    <img
                      src={carouselDetails.url}
                      alt={carouselDetails.carouselCode}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Images className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold">{carouselDetails.carouselCode}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      ID: {carouselDetails.id}
                    </Badge>
                    <Badge
                      variant={carouselDetails.isActive ? "default" : "secondary"}
                      className={
                        carouselDetails.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {carouselDetails.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    Screen Type
                  </label>
                  <p className="text-sm font-medium">{carouselDetails.screenType || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs mr-3 text-muted-foreground font-medium">
                    Visibility
                  </label>
                  <Badge
                    variant="secondary"
                    className={
                      carouselDetails.visibilityType === "ALL"
                        ? "bg-green-100 text-green-700"
                        : carouselDetails.visibilityType === "SUBSCRIBED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {VISIBILITY_TYPES[carouselDetails.visibilityType] || carouselDetails.visibilityType}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Image URL */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Image URL</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm break-all flex-1 text-purple-600">
                    {carouselDetails.url || "-"}
                  </p>
                  {carouselDetails.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(carouselDetails.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Batches Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Mapped Batches ({carouselDetails.batches?.length || 0})
                  </label>
                </div>
                {carouselDetails.batches && carouselDetails.batches.length > 0 ? (
                  <ScrollArea className="h-48 rounded-md border">
                    <div className="p-3 space-y-2">
                      {carouselDetails.batches.map((batch, index) => (
                        <div
                          key={`${batch.batchId}-${index}`}
                          className="p-3 rounded-lg border space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Batch ID: {batch.batchId}</p>
                              {batch.batchCode && (
                                <p className="text-xs text-muted-foreground">
                                  Code: {batch.batchCode}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Order: {batch.displayOrder}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Navigation: </span>
                              <span className="font-medium">
                                {NAVIGATION_TYPES[batch.navigationType] || batch.navigationType}
                              </span>
                            </div>
                            {batch.className && (
                              <div>
                                <span className="text-muted-foreground">Class: </span>
                                <span className="font-medium">{batch.className}</span>
                              </div>
                            )}
                          </div>
                          {batch.activityParams && Object.keys(batch.activityParams).length > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Activity Params: </span>
                              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                                {JSON.stringify(batch.activityParams)}
                              </code>
                            </div>
                          )}
                          {batch.parameter && Object.keys(batch.parameter).length > 0 && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Parameters: </span>
                              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                                {JSON.stringify(batch.parameter)}
                              </code>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No batches mapped</p>
                )}
              </div>

              <Separator />

              {/* Audit Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Created At</label>
                  <p>{formatDate(carouselDetails.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Created By</label>
                  <p>{carouselDetails.createdByName || carouselDetails.createdById || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Updated At</label>
                  <p>{formatDate(carouselDetails.updatedAt)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Updated By</label>
                  <p>{carouselDetails.updatedByName || carouselDetails.updatedById || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 px-6">
            <p className="text-muted-foreground">No carousel details available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
