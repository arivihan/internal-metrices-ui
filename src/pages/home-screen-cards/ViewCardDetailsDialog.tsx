import { useState, useEffect } from "react";
import { Loader2, LayoutGrid, ExternalLink } from "lucide-react";
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

import { fetchHomeScreenCardById } from "@/services/homeScreenCards";
import type { HomeScreenCardDetailResponse } from "@/types/homeScreenCards";
import {
  ICON_MEDIA_TYPES,
  VISIBILITY_TYPES,
  NAVIGATION_TYPES,
} from "@/types/homeScreenCards";

interface ViewCardDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: number | null;
}

export function ViewCardDetailsDialog({
  open,
  onOpenChange,
  cardId,
}: ViewCardDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState<HomeScreenCardDetailResponse | null>(null);

  useEffect(() => {
    if (open && cardId) {
      loadCardDetails();
    } else {
      setCardDetails(null);
    }
  }, [open, cardId]);

  const loadCardDetails = async () => {
    if (!cardId) return;

    setLoading(true);
    try {
      const details = await fetchHomeScreenCardById(cardId);
      console.log("[ViewCardDetailsDialog] Card details:", details);
      setCardDetails(details);
    } catch (error) {
      console.error("[ViewCardDetailsDialog] Failed to load card details:", error);
      toast.error("Failed to load card details");
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
            <LayoutGrid className="h-5 w-5 text-cyan-500" />
            Card Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading card details...
            </span>
          </div>
        ) : cardDetails ? (
          <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-6">
              {/* Card Header */}
              <div className="flex items-start gap-4">
                <div
                  className="h-16 w-16 rounded-lg flex items-center justify-center border shrink-0"
                  style={{
                    backgroundColor: cardDetails.iconBackgroundColor || "#f3f4f6",
                  }}
                >
                  {cardDetails.icon ? (
                    <img
                      src={cardDetails.icon}
                      alt={cardDetails.title}
                      className="h-10 w-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold">{cardDetails.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      ID: {cardDetails.id}
                    </Badge>
                    <Badge
                      variant={cardDetails.isActive ? "default" : "secondary"}
                      className={
                        cardDetails.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {cardDetails.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    Media Type
                  </label>
                  <p className="text-sm font-medium">
                    {ICON_MEDIA_TYPES[cardDetails.iconMediaType] || cardDetails.iconMediaType}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    Visibility
                  </label>
                  <Badge
                    variant="secondary"
                    className={
                      cardDetails.visibility === "ALL"
                        ? "bg-green-100 text-green-700"
                        : cardDetails.visibility === "SUBSCRIBED"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {VISIBILITY_TYPES[cardDetails.visibility] || cardDetails.visibility}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    Icon Background
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded border"
                      style={{ backgroundColor: cardDetails.iconBackgroundColor || "#f3f4f6" }}
                    />
                    <span className="text-sm">{cardDetails.iconBackgroundColor || "-"}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    Tag
                  </label>
                  {cardDetails.tag ? (
                    <Badge
                      style={{
                        backgroundColor: cardDetails.tagBackgroundColor || "#e5e7eb",
                        color: "#374151",
                      }}
                    >
                      {cardDetails.tag}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Icon URL */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Icon URL</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm break-all flex-1 text-cyan-600">
                    {cardDetails.icon || "-"}
                  </p>
                  {cardDetails.icon && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(cardDetails.icon, "_blank")}
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
                    Mapped Batches ({cardDetails.batches?.length || 0})
                  </label>
                </div>
                {cardDetails.batches && cardDetails.batches.length > 0 ? (
                  <ScrollArea className="h-48 rounded-md border">
                    <div className="p-3 space-y-2">
                      {cardDetails.batches.map((batch, index) => (
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
                  <p>{formatDate(cardDetails.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Created By</label>
                  <p>{cardDetails.createdBy || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Updated At</label>
                  <p>{formatDate(cardDetails.updatedAt)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Updated By</label>
                  <p>{cardDetails.updatedBy || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 px-6">
            <p className="text-muted-foreground">No card details available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
