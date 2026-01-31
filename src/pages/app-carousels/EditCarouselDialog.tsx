import { useState, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { Loader2, Trash2, Images, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  selectedCarouselDetails,
  loadCarouselDetails as loadDetails,
  clearCarouselDetails,
} from "@/signals/carouselState";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { updateCarousel } from "@/services/carousels";
import type {
  CarouselUpdateRequest,
  CarouselBatchRequest,
  BatchOption,
  VisibilityType,
  NavigationType,
} from "@/types/carousels";
import { VISIBILITY_TYPES, NAVIGATION_TYPES } from "@/types/carousels";

interface EditCarouselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  carouselId: number | null;
  batches: BatchOption[];
}

const defaultBatch: CarouselBatchRequest = {
  batchId: 0,
  displayOrder: 0,
  className: "",
  activityParams: {},
  navigationType: "EXTERNAL_IMAGE",
  parameter: {},
};

export function EditCarouselDialog({
  open,
  onOpenChange,
  onSuccess,
  carouselId,
  batches,
}: EditCarouselDialogProps) {
  useSignals();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CarouselUpdateRequest>({
    carouselCode: "",
    url: "",
    screenType: "",
    visibilityType: "ALL",
    isActive: true,
    batches: [],
  });

  useEffect(() => {
    if (open && carouselId) {
      loadCarouselDetails();
    }
  }, [open, carouselId]);

  const loadCarouselDetails = async () => {
    if (!carouselId) return;

    // Check if already loaded in signal
    if (selectedCarouselDetails.value?.id === carouselId) {
      console.log("[EditCarouselDialog] Using signal data for:", carouselId);
      const cached = selectedCarouselDetails.value;
      setFormData({
        carouselCode: cached.carouselCode,
        url: cached.url,
        screenType: cached.screenType,
        visibilityType: cached.visibilityType,
        isActive: cached.isActive,
        batches: cached.batches?.map((b) => ({
          batchId: b.batchId,
          displayOrder: b.displayOrder,
          className: b.className || "",
          activityParams: b.activityParams || {},
          navigationType: b.navigationType,
          parameter: b.parameter || {},
        })) || [{ ...defaultBatch }],
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("[EditCarouselDialog] Fetching from API for:", carouselId);
      const carousel = await loadDetails(carouselId);

      setFormData({
        carouselCode: carousel.carouselCode,
        url: carousel.url,
        screenType: carousel.screenType,
        visibilityType: carousel.visibilityType,
        isActive: carousel.isActive,
        batches: carousel.batches?.map((b) => ({
          batchId: b.batchId,
          displayOrder: b.displayOrder,
          className: b.className || "",
          activityParams: b.activityParams || {},
          navigationType: b.navigationType,
          parameter: b.parameter || {},
        })) || [{ ...defaultBatch }],
      });
    } catch (error) {
      console.error("Failed to load carousel details:", error);
      toast.error("Failed to load carousel details");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: keyof CarouselUpdateRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBatchChange = (
    index: number,
    field: keyof CarouselBatchRequest,
    value: any
  ) => {
    setFormData((prev) => {
      const newBatches = [...(prev.batches || [])];
      newBatches[index] = { ...newBatches[index], [field]: value };
      return { ...prev, batches: newBatches };
    });
  };

  const addBatch = () => {
    setFormData((prev) => ({
      ...prev,
      batches: [...(prev.batches || []), { ...defaultBatch }],
    }));
  };

  const removeBatch = (index: number) => {
    if ((formData.batches?.length || 0) <= 1) {
      toast.error("At least one batch is required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      batches: prev.batches?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async () => {
    if (!carouselId) return;

    // Validation
    if (!formData.carouselCode?.trim()) {
      toast.error("Carousel code is required");
      return;
    }
    if (!formData.url?.trim()) {
      toast.error("URL is required");
      return;
    }
    if (!formData.screenType?.trim()) {
      toast.error("Screen type is required");
      return;
    }

    // Validate batches
    for (let i = 0; i < (formData.batches?.length || 0); i++) {
      if (!formData.batches![i].batchId) {
        toast.error(`Please select a batch for batch entry ${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await updateCarousel(carouselId, formData);
      // Clear signal so next fetch gets fresh data
      clearCarouselDetails();
      toast.success("Carousel updated successfully!");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to update carousel:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update carousel"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-purple-500" />
            Edit Carousel
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-6">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading carousel details...
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-6 pb-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Basic Information
                </Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carouselCode">
                      Carousel Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="carouselCode"
                      value={formData.carouselCode || ""}
                      onChange={(e) =>
                        handleInputChange("carouselCode", e.target.value)
                      }
                      placeholder="HOME_TOP_BANNER"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screenType">
                      Screen Type <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.screenType || ""}
                      onValueChange={(value) =>
                        handleInputChange("screenType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select screen type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOME_SCREEN">Home Screen</SelectItem>
                        <SelectItem value="DASHBOARD">Dashboard</SelectItem>
                        <SelectItem value="TOPPER_NOTES">
                          Topper Notes
                        </SelectItem>
                        <SelectItem value="TEST_SERIES">
                          Tests Series
                        </SelectItem>
                        <SelectItem value="LIVE_CLASS">Live Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">
                    Image URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="url"
                    value={formData.url || ""}
                    onChange={(e) => handleInputChange("url", e.target.value)}
                    placeholder="https://cdn.example.com/carousel/banner.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibilityType">Visibility</Label>
                    <Select
                      value={formData.visibilityType || "ALL"}
                      onValueChange={(value) =>
                        handleInputChange(
                          "visibilityType",
                          value as VisibilityType,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VISIBILITY_TYPES).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Active Status</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        checked={formData.isActive ?? true}
                        onCheckedChange={(checked) =>
                          handleInputChange("isActive", checked)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Batch Configurations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Batch Configurations
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBatch}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Batch
                  </Button>
                </div>

                {formData.batches?.map((batch, index) => (
                  <div key={index} className="p-4 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Batch #{index + 1}
                      </Label>
                      {(formData.batches?.length || 0) > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBatch(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Batch <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={batch.batchId?.toString() || ""}
                          onValueChange={(value) =>
                            handleBatchChange(index, "batchId", Number(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>
                                {b.name}
                                {b.code ? ` (${b.code})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={batch.displayOrder}
                          onChange={(e) =>
                            handleBatchChange(
                              index,
                              "displayOrder",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          min={0}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Navigation Type</Label>
                        <Select
                          value={batch.navigationType}
                          onValueChange={(value) =>
                            handleBatchChange(
                              index,
                              "navigationType",
                              value as NavigationType,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select navigation" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(NAVIGATION_TYPES).map(
                              ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Class Name</Label>
                        <Input
                          value={batch.className || ""}
                          onChange={(e) =>
                            handleBatchChange(
                              index,
                              "className",
                              e.target.value,
                            )
                          }
                          placeholder="com.example.Activity"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Activity Params</Label>
                      <div className="space-y-2">
                        {Object.entries(batch.activityParams || {}).map(
                          ([key, value], paramIndex) => (
                            <div
                              key={paramIndex}
                              className="flex items-center gap-2"
                            >
                              <Input
                                placeholder="Key"
                                value={key}
                                onChange={(e) => {
                                  const newParams = {
                                    ...batch.activityParams,
                                  };
                                  const oldValue = newParams[key];
                                  delete newParams[key];
                                  if (e.target.value) {
                                    newParams[e.target.value] = oldValue;
                                  }
                                  handleBatchChange(
                                    index,
                                    "activityParams",
                                    newParams,
                                  );
                                }}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Value"
                                value={String(value ?? "")}
                                onChange={(e) => {
                                  const newParams = {
                                    ...batch.activityParams,
                                  };
                                  newParams[key] = e.target.value;
                                  handleBatchChange(
                                    index,
                                    "activityParams",
                                    newParams,
                                  );
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newParams = {
                                    ...batch.activityParams,
                                  };
                                  delete newParams[key];
                                  handleBatchChange(
                                    index,
                                    "activityParams",
                                    newParams,
                                  );
                                }}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ),
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newParams = {
                              ...batch.activityParams,
                              "": "",
                            };
                            handleBatchChange(
                              index,
                              "activityParams",
                              newParams,
                            );
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Param
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Parameters (JSON)</Label>
                      <Textarea
                        value={
                          typeof batch.parameter === "object"
                            ? JSON.stringify(batch.parameter, null, 2)
                            : "{}"
                        }
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value || "{}");
                            handleBatchChange(index, "parameter", parsed);
                          } catch {
                            // Keep raw value if invalid JSON
                          }
                        }}
                        placeholder='{"filters": {"subject": "Physics"}}'
                        className="font-mono text-xs h-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
