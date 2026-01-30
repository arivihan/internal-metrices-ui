import { useState, useEffect } from "react";
import {
  Loader2,
  Tag,
  Hash,
  Calendar,
  Film,
  Copy,
  Check,
  ExternalLink,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { fetchTagById } from "@/services/tags";
import type { TagResponse } from "@/types/tags";

interface ViewTagDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagId: number | null;
}

export function ViewTagDetailsDialog({
  open,
  onOpenChange,
  tagId,
}: ViewTagDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tag, setTag] = useState<TagResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (open && tagId) {
      loadTagData();
    }
  }, [open, tagId]);

  const loadTagData = async () => {
    if (!tagId) return;

    setIsLoading(true);
    try {
      const tagData = await fetchTagById(tagId);
      setTag(tagData);
    } catch (error) {
      console.error("[ViewTagDetailsDialog] Failed to load tag:", error);
      toast.error("Failed to load tag details");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTag(null);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-violet-500" />
            Tag Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            <span className="ml-2 text-sm text-muted-foreground">Loading tag details...</span>
          </div>
        ) : tag ? (
          <div className="space-y-6 py-4">
            {/* Main Info Card */}
            <div className="rounded-lg border p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10">
                  <Hash className="h-7 w-7 text-violet-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">{tag.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(tag.name, "name")}
                    >
                      {copiedField === "name" ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {tag.slug}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => copyToClipboard(tag.slug, "slug")}
                    >
                      {copiedField === "slug" ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Badge
                  className={
                    tag.reelCount > 0
                      ? "bg-pink-500 hover:bg-pink-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  <Film className="h-3.5 w-3.5 mr-1" />
                  {tag.reelCount} Reels
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tag ID */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Hash className="h-3.5 w-3.5" />
                  Tag ID
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">{tag.id}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyToClipboard(String(tag.id), "id")}
                  >
                    {copiedField === "id" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Reel Count */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Film className="h-3.5 w-3.5" />
                  Associated Reels
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">{tag.reelCount}</span>
                  {tag.reelCount > 0 && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Created At */}
              <div className="rounded-lg border p-4 col-span-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Created At
                </div>
                <div className="font-medium text-sm">
                  {formatDateTime(tag.createdAt)}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-dashed p-4">
              <div className="text-xs text-muted-foreground mb-3 font-medium">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => copyToClipboard(`#${tag.name}`, "hashtag")}
                >
                  {copiedField === "hashtag" ? (
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <Hash className="h-3 w-3 mr-1" />
                  )}
                  Copy as Hashtag
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => copyToClipboard(JSON.stringify(tag, null, 2), "json")}
                >
                  {copiedField === "json" ? (
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <ExternalLink className="h-3 w-3 mr-1" />
                  )}
                  Copy as JSON
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Tag className="h-12 w-12 mb-4 opacity-50" />
            <p>Tag not found</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleClose} className="bg-violet-500 hover:bg-violet-600">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
