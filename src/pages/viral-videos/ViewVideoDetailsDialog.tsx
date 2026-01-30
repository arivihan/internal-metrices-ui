import { useState, useEffect } from "react";
import { Eye, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { fetchVideoById } from "@/services/viralVideos";
import type { VideoResponseDto } from "@/types/viralVideos";
import { VIDEO_TYPES } from "@/types/viralVideos";

interface ViewVideoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string | null;
}

export function ViewVideoDetailsDialog({
  open,
  onOpenChange,
  videoId,
}: ViewVideoDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [videoDetails, setVideoDetails] = useState<VideoResponseDto | null>(null);

  useEffect(() => {
    if (open && videoId) {
      loadVideoDetails();
    } else {
      setVideoDetails(null);
    }
  }, [open, videoId]);

  const loadVideoDetails = async () => {
    if (!videoId) return;

    setLoading(true);
    try {
      const response = await fetchVideoById(videoId);
      setVideoDetails(response);
    } catch (error) {
      console.error("[ViewVideoDetailsDialog] Error loading video:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load video details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getTypeDisplay = (type: string) => {
    return VIDEO_TYPES[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-rose-500" />
            Video Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Loading details...</span>
          </div>
        ) : videoDetails ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Code & Thumbnail */}
              <div className="flex gap-4">
                {videoDetails.thumbnailUrl && (
                  <img
                    src={videoDetails.thumbnailUrl}
                    alt={videoDetails.code}
                    className="h-24 w-32 object-cover rounded-lg border"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-semibold">{videoDetails.code}</h3>
                  <div className="flex items-center gap-2">
                    {/* <Badge variant="outline" className="text-xs">
                      ID: {videoDetails.id}
                    </Badge> */}
                    <Badge variant="outline" className="text-xs">
                      {getTypeDisplay(videoDetails.type)}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Display Order</label>
                  <p className="font-medium">{videoDetails.displayOrder}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Orientation</label>
                  <p className="font-medium">{videoDetails.videoOrientation}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Display Context</label>
                  <p className="font-medium">{videoDetails.displayContext || "-"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Status</label>
                  <p>
                    <Badge
                      variant={videoDetails.isActive ? "default" : "secondary"}
                      className={videoDetails.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {videoDetails.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                </div>
              </div>

              <Separator />

              {/* Video URL */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Video URL</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm break-all flex-1 text-rose-600">
                    {videoDetails.url || "-"}
                  </p>
                  {videoDetails.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(videoDetails.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  )}
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Thumbnail URL</label>
                <div className="flex items-center gap-2">
                  <p className="text-sm break-all flex-1 text-muted-foreground">
                    {videoDetails.thumbnailUrl || "-"}
                  </p>
                  {videoDetails.thumbnailUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(videoDetails.thumbnailUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              {/* Batches */}
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground font-medium">
                  Mapped Batches ({videoDetails.batches?.length || 0})
                </label>
                {videoDetails.batches && videoDetails.batches.length > 0 ? (
                  <div className="space-y-2">
                    {videoDetails.batches.map((batch, index) => (
                      <div
                        key={batch.batchId || index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{batch.batchName}</p>
                          <p className="text-xs text-muted-foreground break-words">
                            {batch.batchCode}
                          </p>
                        </div>
                        {/* <Badge variant="outline" className="text-xs">
                          ID: {batch.batchId}
                        </Badge> */}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No batches mapped</p>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No video details available</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
