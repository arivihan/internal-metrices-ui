import { useState, useEffect } from "react";
import {
  Loader2,
  LayoutGrid,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import {
  fetchHomeScreenCardById,
  updateHomeScreenCard,
} from "@/services/homeScreenCards";
import type {
  HomeScreenCardUpdateRequest,
  CardBatchRequest,
  IconMediaType,
  VisibilityType,
  NavigationType,
} from "@/types/homeScreenCards";
import {
  ICON_MEDIA_TYPES,
  VISIBILITY_TYPES,
  NAVIGATION_TYPES,
} from "@/types/homeScreenCards";

interface BatchOption {
  id: number;
  name: string;
  code?: string;
}

interface EditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  cardId: number | null;
  batches: BatchOption[];
}

interface KeyValuePair {
  key: string;
  value: string;
}

interface BatchFormData {
  batchId: number | null;
  displayOrder: number;
  className: string;
  navigationType: NavigationType;
  activityParams: KeyValuePair[];
  parameterJson: string; // Simple JSON string for parameter
  isOpen: boolean;
}

const initialBatchFormData: BatchFormData = {
  batchId: null,
  displayOrder: 0,
  className: "",
  navigationType: "CLASS_PARAMS",
  activityParams: [],
  parameterJson: "{}",
  isOpen: true,
};

// Convert object to key-value pairs array
const objectToKeyValuePairs = (obj: Record<string, any>): KeyValuePair[] => {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
};

// Convert key-value pairs to JSON object
const keyValuePairsToObject = (pairs: KeyValuePair[]): Record<string, any> => {
  const obj: Record<string, any> = {};
  pairs.forEach((pair) => {
    if (pair.key.trim()) {
      // Try to parse value as JSON, otherwise use as string
      try {
        obj[pair.key.trim()] = JSON.parse(pair.value);
      } catch {
        obj[pair.key.trim()] = pair.value;
      }
    }
  });
  return obj;
};

// Parse parameter JSON string safely
const parseParameterJson = (jsonStr: string): Record<string, Record<string, any>> => {
  try {
    const parsed = JSON.parse(jsonStr);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

// Convert parameter object to JSON string for display
const parameterObjectToJson = (obj: Record<string, Record<string, any>> | null | undefined): string => {
  if (!obj || typeof obj !== "object") return "{}";
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "{}";
  }
};

export function EditCardDialog({
  open,
  onOpenChange,
  onSuccess,
  cardId,
  batches,
}: EditCardDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [iconBackgroundColor, setIconBackgroundColor] = useState("#ffffff");
  const [iconMediaType, setIconMediaType] = useState<IconMediaType>("IMAGE");
  const [tag, setTag] = useState("");
  const [tagBackgroundColor, setTagBackgroundColor] = useState("#e5e7eb");
  const [visibility, setVisibility] = useState<VisibilityType>("ALL");

  // Batches array
  const [batchesForms, setBatchesForms] = useState<BatchFormData[]>([
    { ...initialBatchFormData },
  ]);

  // Load card data when dialog opens
  useEffect(() => {
    if (open && cardId) {
      loadCardData();
    }
  }, [open, cardId]);

  const loadCardData = async () => {
    if (!cardId) return;

    setIsLoading(true);
    try {
      console.log("[EditCardDialog] Loading card:", cardId);
      const cardData = await fetchHomeScreenCardById(cardId);
      console.log("[EditCardDialog] Card data:", cardData);

      // Populate form fields
      setTitle(cardData.title || "");
      setIcon(cardData.icon || "");
      setIconBackgroundColor(cardData.iconBackgroundColor || "#ffffff");
      setIconMediaType(cardData.iconMediaType || "IMAGE");
      setTag(cardData.tag || "");
      setTagBackgroundColor(cardData.tagBackgroundColor || "#e5e7eb");
      setVisibility(cardData.visibility || "ALL");

      // Populate batches
      if (cardData.batches && cardData.batches.length > 0) {
        const mappedBatches: BatchFormData[] = cardData.batches.map((batch) => ({
          batchId: batch.batchId,
          displayOrder: batch.displayOrder || 0,
          className: batch.className || "",
          navigationType: batch.navigationType || "CLASS_PARAMS",
          activityParams: objectToKeyValuePairs(batch.activityParams || {}),
          parameterJson: parameterObjectToJson(batch.parameter),
          isOpen: false,
        }));
        setBatchesForms(mappedBatches);
      } else {
        setBatchesForms([{ ...initialBatchFormData, activityParams: [] }]);
      }
    } catch (error) {
      console.error("[EditCardDialog] Failed to load card:", error);
      toast.error(
        "Failed to load card data: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const addBatch = () => {
    setBatchesForms((prev) => [
      ...prev,
      { ...initialBatchFormData, activityParams: [], isOpen: true },
    ]);
  };

  const removeBatch = (index: number) => {
    if (batchesForms.length > 1) {
      setBatchesForms((prev) => prev.filter((_, i) => i !== index));
    } else {
      toast.error("At least one batch is required");
    }
  };

  const updateBatch = (index: number, field: keyof BatchFormData, value: any) => {
    setBatchesForms((prev) =>
      prev.map((batch, i) => (i === index ? { ...batch, [field]: value } : batch))
    );
  };

  const toggleBatchOpen = (index: number) => {
    setBatchesForms((prev) =>
      prev.map((batch, i) =>
        i === index ? { ...batch, isOpen: !batch.isOpen } : batch
      )
    );
  };

  // Activity Params Key-Value handlers
  const addActivityParam = (batchIndex: number) => {
    setBatchesForms((prev) =>
      prev.map((batch, i) =>
        i === batchIndex
          ? {
              ...batch,
              activityParams: [...batch.activityParams, { key: "", value: "" }],
            }
          : batch
      )
    );
  };

  const removeActivityParam = (batchIndex: number, paramIndex: number) => {
    setBatchesForms((prev) =>
      prev.map((batch, i) =>
        i === batchIndex
          ? {
              ...batch,
              activityParams: batch.activityParams.filter(
                (_, pi) => pi !== paramIndex
              ),
            }
          : batch
      )
    );
  };

  const updateActivityParam = (
    batchIndex: number,
    paramIndex: number,
    field: "key" | "value",
    value: string
  ) => {
    setBatchesForms((prev) =>
      prev.map((batch, i) =>
        i === batchIndex
          ? {
              ...batch,
              activityParams: batch.activityParams.map((param, pi) =>
                pi === paramIndex ? { ...param, [field]: value } : param
              ),
            }
          : batch
      )
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error("Please enter a card title");
      return false;
    }

    if (!icon.trim()) {
      toast.error("Please enter an icon URL");
      return false;
    }

    // Validate batches
    for (let i = 0; i < batchesForms.length; i++) {
      const batch = batchesForms[i];
      if (!batch.batchId) {
        toast.error(`Please select a batch for Batch ${i + 1}`);
        return false;
      }

      // Validate parameter JSON
      try {
        JSON.parse(batch.parameterJson);
      } catch {
        toast.error(`Invalid JSON in Parameter field for Batch ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!cardId || !validateForm()) return;

    setIsSubmitting(true);

    try {
      // Build batches array
      const batchesData: CardBatchRequest[] = batchesForms.map((batch) => ({
        batchId: batch.batchId!,
        displayOrder: batch.displayOrder,
        className: batch.className,
        navigationType: batch.navigationType,
        activityParams: keyValuePairsToObject(batch.activityParams),
        parameter: parseParameterJson(batch.parameterJson),
      }));

      const requestData: HomeScreenCardUpdateRequest = {
        title: title.trim(),
        icon: icon.trim(),
        iconBackgroundColor,
        iconMediaType,
        tag: tag.trim() || undefined,
        tagBackgroundColor: tag.trim() ? tagBackgroundColor : undefined,
        visibility,
        batches: batchesData,
      };

      console.log("[EditCardDialog] Updating card:", { cardId, requestData });

      await updateHomeScreenCard(cardId, requestData);

      toast.success("Card updated successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("[EditCardDialog] Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update card"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBatchName = (batchId: number | null) => {
    if (!batchId) return "Select Batch";
    const batch = batches.find((b) => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex h-full w-full flex-col p-0 sm:max-w-2xl">
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-cyan-500" />
            Edit Card
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Card Information
                </h3>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter card title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Icon URL */}
                <div className="space-y-2">
                  <Label htmlFor="icon">
                    Icon URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="icon"
                    placeholder="https://example.com/icon.png"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                  />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Icon Media Type */}
                  <div className="space-y-2">
                    <Label htmlFor="iconMediaType">Icon Media Type</Label>
                    <Select
                      value={iconMediaType}
                      onValueChange={(value) =>
                        setIconMediaType(value as IconMediaType)
                      }
                    >
                      <SelectTrigger id="iconMediaType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ICON_MEDIA_TYPES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Icon Background Color */}
                  <div className="space-y-2">
                    <Label htmlFor="iconBackgroundColor">Icon Background</Label>
                    <div className="flex gap-2">
                      <Input
                        id="iconBackgroundColor"
                        type="color"
                        value={iconBackgroundColor}
                        onChange={(e) => setIconBackgroundColor(e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={iconBackgroundColor}
                        onChange={(e) => setIconBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Tag */}
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag (Optional)</Label>
                  <Input
                    id="tag"
                    placeholder="e.g., New, Popular"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                  />
                </div>

                {tag && (
                  <div className="space-y-2">
                    <Label htmlFor="tagBackgroundColor">Tag Background</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tagBackgroundColor"
                        type="color"
                        value={tagBackgroundColor}
                        onChange={(e) => setTagBackgroundColor(e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={tagBackgroundColor}
                        onChange={(e) => setTagBackgroundColor(e.target.value)}
                        placeholder="#e5e7eb"
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {/* Visibility */}
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={visibility}
                    onValueChange={(value) =>
                      setVisibility(value as VisibilityType)
                    }
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VISIBILITY_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Batches Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Batch Configurations
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBatch}
                    className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Batch
                  </Button>
                </div>

                {batchesForms.map((batch, index) => (
                  <Collapsible
                    key={index}
                    open={batch.isOpen}
                    onOpenChange={() => toggleBatchOpen(index)}
                    className="rounded-lg border"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Batch {index + 1}: {getBatchName(batch.batchId)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {batchesForms.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBatch(index);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {batch.isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 pt-0 space-y-4">
                        {/* Batch Selection */}
                        <div className="space-y-2">
                          <Label>
                            Batch <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={batch.batchId?.toString() || ""}
                            onValueChange={(value) =>
                              updateBatch(index, "batchId", Number(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {batches.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Display Order */}
                          <div className="space-y-2">
                            <Label>Display Order</Label>
                            <Input
                              type="number"
                              min={0}
                              value={batch.displayOrder}
                              onChange={(e) =>
                                updateBatch(
                                  index,
                                  "displayOrder",
                                  parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </div>

                          {/* Navigation Type */}
                          <div className="space-y-2">
                            <Label>Navigation Type</Label>
                            <Select
                              value={batch.navigationType}
                              onValueChange={(value) =>
                                updateBatch(
                                  index,
                                  "navigationType",
                                  value as NavigationType
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(NAVIGATION_TYPES).map(
                                  ([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Class Name */}
                        <div className="space-y-2">
                          <Label>Class Name</Label>
                          <Input
                            placeholder="e.g., com.example.Activity"
                            value={batch.className}
                            onChange={(e) =>
                              updateBatch(index, "className", e.target.value)
                            }
                          />
                        </div>

                        {/* Activity Params (Key-Value Pairs) */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Activity Params</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addActivityParam(index)}
                              className="h-7 text-xs"
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add Param
                            </Button>
                          </div>

                          {batch.activityParams.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                              No activity params added. Click "Add Param" to add key-value pairs.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {batch.activityParams.map((param, paramIndex) => (
                                <div
                                  key={paramIndex}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    placeholder="Key"
                                    value={param.key}
                                    onChange={(e) =>
                                      updateActivityParam(
                                        index,
                                        paramIndex,
                                        "key",
                                        e.target.value
                                      )
                                    }
                                    className="flex-1"
                                  />
                                  <span className="text-muted-foreground">:</span>
                                  <Input
                                    placeholder="Value"
                                    value={param.value}
                                    onChange={(e) =>
                                      updateActivityParam(
                                        index,
                                        paramIndex,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeActivityParam(index, paramIndex)
                                    }
                                    className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Parameter (JSON Textarea) */}
                        <div className="space-y-2">
                          <Label>Parameter</Label>
                          <Textarea
                            placeholder="{}"
                            value={batch.parameterJson}
                            onChange={(e) =>
                              updateBatch(index, "parameterJson", e.target.value)
                            }
                            className="font-mono text-sm min-h-[100px]"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter valid JSON object
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              {/* Preview */}
              {icon && (
                <div className="rounded-lg border p-4 bg-muted/30">
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    Preview
                  </Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="h-16 w-16 rounded-lg flex items-center justify-center border"
                      style={{ backgroundColor: iconBackgroundColor }}
                    >
                      <img
                        src={icon}
                        alt="Icon preview"
                        className="h-10 w-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {title || "Card Title"}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {tag && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: tagBackgroundColor }}
                          >
                            {tag}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded">
                          {ICON_MEDIA_TYPES[iconMediaType]}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {VISIBILITY_TYPES[visibility]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <SheetFooter className="shrink-0 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || !title.trim() || !icon.trim()}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Changes
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
