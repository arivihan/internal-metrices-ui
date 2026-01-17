import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DynamicIcon } from "@/lib/icon-map";
import { Loader2, X, GripVertical } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";

interface Section {
  title: string;
  description: string;
  fieldName: string;
  selectionType: "single" | "multi-select";
  fetchUrl: string;
  searchParam?: string;
  optionLabelKey: string;
  optionValueKey: string;
  placeholder?: string;
  includeDisplayOrder?: boolean;
  displayOrderPlaceholder?: string;
  deleteFetchUrl?: string;
}

interface Action {
  id: string;
  type: "modal" | "copy" | "submit";
  label: string;
  icon: string;
  buttonVariant: string;
  modalTitle?: string;
  modalDescription?: string;
  modalFetchUrl?: string;
  modalOptionLabelKey?: string;
  modalOptionValueKey?: string;
  modalSelectionType?: string;
}

interface DualSectionViewProps {
  title: string;
  description?: string;
  icon?: string;
  leftSection: Section;
  rightSection: Section;
  actions: Action[];
  submitUrl: string;
  submitText: string;
  method: "POST" | "PATCH";
  onSuccess?: () => void;
}

interface SelectionItem {
  [key: string]: any;
}

interface SelectedData {
  [key: string]: any;
  displayOrder?: number;
}

export const DualSectionView: React.FC<DualSectionViewProps> = ({
  leftSection,
  rightSection,
  actions,
  submitUrl,
  method,
  onSuccess,
}) => {
  const [leftOptions, setLeftOptions] = useState<SelectionItem[]>([]);
  const [rightOptions, setRightOptions] = useState<SelectionItem[]>([]);
  const [allModalOptions, setAllModalOptions] = useState<SelectionItem[]>([]);
  const [addedItems, setAddedItems] = useState<Record<string, SelectionItem>>(
    {}
  );
  const [leftLoading, setLeftLoading] = useState(false);
  const [rightLoading, setRightLoading] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedLeftObject, setSelectedLeftObject] =
    useState<SelectionItem | null>(null);
  const [selectedRight, setSelectedRight] = useState<string[]>([]);
  const [rightDisplayOrders, setRightDisplayOrders] = useState<
    Record<string, number>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [searchLeft, setSearchLeft] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSelectedItems, setModalSelectedItems] = useState<Set<string>>(
    new Set()
  );
  const [originalRightOptions, setOriginalRightOptions] = useState<
    SelectionItem[]
  >([]);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Pagination states for left section
  const [leftPageNumber, setLeftPageNumber] = useState(0);
  const [leftPageSize, setLeftPageSize] = useState(10);
  const [leftTotalElements, setLeftTotalElements] = useState(0);

  // Pagination states for modal
  const [modalPageNumber, setModalPageNumber] = useState(0);
  const [modalPageSize, setModalPageSize] = useState(10);
  const [modalTotalElements, setModalTotalElements] = useState(0);
  const [modalTotalPages, setModalTotalPages] = useState(0);

  // Fetch left section options on mount
  useEffect(() => {
    console.log("[DualSectionView] Mounted, fetching left options");
    fetchLeftOptions();
  }, [leftSection.fetchUrl]);

  // Fetch right section options when left selection changes
  useEffect(() => {
    if (selectedLeft) {
      console.log(
        `[DualSectionView] Selected left: ${selectedLeft}, fetching right options`
      );
      fetchRightOptions();
    } else {
      console.log(
        "[DualSectionView] No left selection, clearing right options"
      );
      setRightOptions([]);
      setSelectedRight([]);
      setRightDisplayOrders({});
      setOriginalRightOptions([]);
    }
  }, [
    selectedLeft,
    selectedLeftObject,
    rightSection.fetchUrl,
    rightSection.searchParam,
    (rightSection as any).searchParams,
  ]);

  const fetchLeftOptions = async (pageNumber: number = 0) => {
    try {
      setLeftLoading(true);
      setLeftPageNumber(pageNumber);
      console.log(
        `[DualSectionView] Fetching left options from: ${leftSection.fetchUrl} - Page: ${pageNumber}`
      );
      const response = await apiClient<any>(leftSection.fetchUrl, {
        method: "GET",
        params: {
          level: "SYSTEM",
          pageNo: String(pageNumber),
          pageSize: String(leftPageSize),
        },
      });
      console.log("[DualSectionView] Left options response:", response);

      // Handle paginated response
      let data = [];
      let totalElements = 0;

      if (response?.content && Array.isArray(response.content)) {
        data = response.content;
        totalElements = response.totalElements || 0;
        setLeftTotalElements(totalElements);
      } else if (Array.isArray(response?.data)) {
        data = response.data;
        totalElements = response.data.length;
        setLeftTotalElements(totalElements);
      } else if (Array.isArray(response)) {
        data = response;
        totalElements = response.length;
        setLeftTotalElements(totalElements);
      }

      console.log("[DualSectionView] Parsed left data:", data);
      setLeftOptions(data || []);

      // Auto-select first item on initial load (page 0) or if no selection exists
      if (data && data.length > 0 && (pageNumber === 0 || !selectedLeft)) {
        const firstItem = data[0];
        const firstItemValue = String(firstItem[leftValue]);
        console.log("[DualSectionView] Auto-selecting first item:", firstItem);
        setSelectedLeft(firstItemValue);
        setSelectedLeftObject(firstItem);
      }
    } catch (error) {
      console.error("[DualSectionView] Failed to fetch left options:", error);
      setLeftOptions([]);
    } finally {
      setLeftLoading(false);
    }
  };

  const fetchRightOptions = async () => {
    try {
      setRightLoading(true);
      const params: Record<string, string> = { level: "SYSTEM" };

      // Check if we need extracted fields for search params
      if ((rightSection as any).searchParams && selectedLeftObject) {
        const searchParams = (rightSection as any).searchParams;
        console.log(
          "[DualSectionView] Using extracted searchParams:",
          searchParams
        );
        for (const [paramKey, objectKey] of Object.entries(searchParams)) {
          // Fix: Ensure objectKey is treated as a string key and value is converted to string
          const key = objectKey as string;
          params[paramKey] = String(selectedLeftObject[key] || "");
        }
      } else if (rightSection.searchParam && selectedLeft) {
        // Fallback to old searchParam (single param)
        params[rightSection.searchParam] = String(selectedLeft);
      }

      console.log(
        `[DualSectionView] Fetching right options from: ${rightSection.fetchUrl}`,
        params
      );
      const response = await apiClient<any>(rightSection.fetchUrl, {
        method: "GET",
        params,
      });
      console.log("[DualSectionView] Right options response:", response);
      const data = Array.isArray(response?.content)
        ? response.content
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
      console.log("[DualSectionView] Parsed right data:", data);
      setRightOptions(data || []);
      setOriginalRightOptions(data || []);

      // Auto-populate selectedRight with the IDs from fetched items so they display as selected
      const selectedIds = (data || []).map((item: any) =>
        String(item[rightSection.optionValueKey])
      );
      console.log("[DualSectionView] Auto-selected right items:", selectedIds);
      setSelectedRight(selectedIds);

      // Auto-populate display orders from fetched items
      const orders: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        const itemId = String(item[rightSection.optionValueKey]);
        orders[itemId] = item.displayOrder || 0;
      });
      setRightDisplayOrders(orders);
      setAddedItems({}); // Clear added items when left selection changes
    } catch (error) {
      console.error("[DualSectionView] Failed to fetch right options:", error);
      setRightOptions([]);
      setOriginalRightOptions([]);
    } finally {
      setRightLoading(false);
    }
  };

  const handleAddItemsClick = async (pageNum: number = 0) => {
    const addAction = actions.find((a) => a.type === "modal");
    if (addAction?.modalFetchUrl) {
      setModalLoading(true);
      setModalPageNumber(pageNum);
      try {
        console.log(
          `[DualSectionView] Fetching modal options from: ${addAction.modalFetchUrl} (page ${pageNum})`
        );
        const response = await apiClient<any>(addAction.modalFetchUrl, {
          method: "GET",
          params: {
            level: "SYSTEM",
            pageNo: String(pageNum),
            pageSize: String(modalPageSize),
          },
        });
        console.log("[DualSectionView] Modal options response:", response);
        const data = Array.isArray(response?.content)
          ? response.content
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

        // Extract pagination info
        const totalElements = (response as any)?.totalElements ?? data.length;
        const totalPages =
          (response as any)?.totalPages ??
          Math.ceil(totalElements / modalPageSize);

        console.log("[DualSectionView] Parsed modal data:", data);
        setAllModalOptions(data || []);
        setModalTotalElements(totalElements);
        setModalTotalPages(totalPages);
        setShowAddModal(true);
      } catch (error) {
        console.error(
          "[DualSectionView] Failed to fetch modal options:",
          error
        );
      } finally {
        setModalLoading(false);
      }
    }
  };

  const handleAddSelectedItems = (selectedIds: string[]) => {
    const addAction = actions.find((a) => a.type === "modal");
    if (!addAction) return;

    const modalValueKey = addAction.modalOptionValueKey || "id";
    const modalLabelKey = addAction.modalOptionLabelKey || "name";

    // Get selected items from modal
    const newItems = allModalOptions.filter((item) =>
      selectedIds.includes(String(item[modalValueKey]))
    );

    // Transform items to match rightSection structure and store them
    // Keep ALL original item data + add the mapped fields
    const newAddedItems: Record<string, SelectionItem> = {};
    newItems.forEach((item) => {
      const itemId = String(item[modalValueKey]);
      const itemLabel =
        item[modalLabelKey] ||
        item.displayName ||
        item.name ||
        item.gradeName ||
        `Item ${itemId}`;

      console.log("[DualSectionView] Adding item:", {
        itemId,
        modalLabelKey,
        itemLabel,
        originalItem: item,
      });

      newAddedItems[itemId] = {
        ...item, // Keep all original fields
        [rightSection.optionValueKey]: itemId,
        [rightSection.optionLabelKey]: itemLabel, // Set the mapped label field
        // Also set common label fields for fallback rendering
        name: item.name || itemLabel,
        gradeName: item.gradeName || itemLabel,
        displayName: item.displayName || itemLabel,
      };
    });

    // Add new items avoiding duplicates
    const existingIds = selectedRight;
    const uniqueNewIds = Object.keys(newAddedItems).filter(
      (id) => !existingIds.includes(id)
    );

    const combined = [...selectedRight, ...uniqueNewIds];
    console.log("[DualSectionView] Adding items:", {
      newAddedItems,
      uniqueNewIds,
      combined,
    });
    setSelectedRight(combined);

    // Store the added items for later lookup
    setAddedItems((prev) => ({
      ...prev,
      ...newAddedItems,
    }));

    // Auto-set display orders for new items
    if (rightSection.includeDisplayOrder) {
      const maxOrder = Math.max(0, ...Object.values(rightDisplayOrders), 0);
      uniqueNewIds.forEach((itemId, idx) => {
        setRightDisplayOrders((prev) => ({
          ...prev,
          [itemId]: maxOrder + idx + 1,
        }));
      });
    }

    setShowAddModal(false);
    setModalSelectedItems(new Set());
  };

  const handleRemoveRightItem = async (itemId: string) => {
    // Check if this is a newly added item (not in original)
    const isNewlyAdded = !originalRightOptions.some(
      (item) => String(item[rightSection.optionValueKey]) === itemId
    );

    console.log("[DualSectionView] Removing item:", { itemId, isNewlyAdded });

    // For existing items, show confirmation dialog
    if (!isNewlyAdded) {
      setDeleteItemId(itemId);
      setDeleteConfirmOpen(true);
      return;
    }

    // For newly added items, just remove from selection
    setSelectedRight((prev) => prev.filter((id) => id !== itemId));
    setRightDisplayOrders((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
    setAddedItems((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteItemId || !rightSection.deleteFetchUrl) {
      setDeleteConfirmOpen(false);
      return;
    }

    try {
      setIsDeleting(true);

      // Find the full item to get the mapping ID
      const itemToDelete = originalRightOptions.find(
        (item) => String(item[rightSection.optionValueKey]) === deleteItemId
      );

      if (!itemToDelete) {
        console.error(
          "[DualSectionView] Item not found for deletion:",
          deleteItemId
        );
        toast.error("Item not found");
        setDeleteConfirmOpen(false);
        return;
      }

      // Get the mapping ID - look for common ID field names
      const mappingId =
        itemToDelete.id ||
        itemToDelete.examGradeMappingId ||
        itemToDelete.mappingId ||
        deleteItemId;

      // Replace placeholder in delete URL
      const deleteUrl = rightSection.deleteFetchUrl.replace(
        "{examGradeMappingId}",
        String(mappingId)
      );

      console.log("[DualSectionView] Calling delete API:", {
        deleteUrl,
        deleteItemId,
        mappingId,
        itemToDelete,
      });

      await apiClient(deleteUrl, {
        method: "DELETE",
      });

      toast.success("Item deleted successfully");
      console.log("[DualSectionView] Item deleted successfully");

      // Remove from state
      setSelectedRight((prev) => prev.filter((id) => id !== deleteItemId));
      setRightDisplayOrders((prev) => {
        const updated = { ...prev };
        delete updated[deleteItemId];
        return updated;
      });

      // Update original options to reflect deletion
      setOriginalRightOptions((prev) =>
        prev.filter(
          (item) => String(item[rightSection.optionValueKey]) !== deleteItemId
        )
      );

      setDeleteConfirmOpen(false);
      setDeleteItemId(null);
    } catch (error) {
      console.error("[DualSectionView] Failed to delete item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItemId(itemId);
    console.log("[DualSectionView] Drag started:", itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(itemId);
  };

  const handleDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    console.log("[DualSectionView] Drop triggered:", {
      draggedItemId,
      targetItemId,
    });

    // Reorder items
    const oldIndex = selectedRight.indexOf(draggedItemId);
    const newIndex = selectedRight.indexOf(targetItemId);

    if (oldIndex === -1 || newIndex === -1) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const newSelectedRight = Array.from(selectedRight);
    newSelectedRight.splice(oldIndex, 1);
    newSelectedRight.splice(newIndex, 0, draggedItemId);

    console.log("[DualSectionView] New order:", newSelectedRight);
    setSelectedRight(newSelectedRight);

    // Auto-update display orders from 1 onwards
    const newDisplayOrders: Record<string, number> = {};
    newSelectedRight.forEach((itemId, idx) => {
      newDisplayOrders[itemId] = idx + 1;
    });

    console.log("[DualSectionView] Updated display orders:", newDisplayOrders);
    setRightDisplayOrders(newDisplayOrders);

    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  const handleRightSelection = (id: string, isSelected: boolean) => {
    // This is called by modal handler, kept for reference
    if (isSelected) {
      setSelectedRight([...selectedRight, id]);
      if (rightSection.includeDisplayOrder) {
        setRightDisplayOrders({
          ...rightDisplayOrders,
          [id]: rightDisplayOrders[id] || 0,
        });
      }
    } else {
      setSelectedRight(selectedRight.filter((item) => item !== id));
      const newOrders = { ...rightDisplayOrders };
      delete newOrders[id];
      setRightDisplayOrders(newOrders);
    }
  };

  const handleDisplayOrderChange = (id: string, order: number) => {
    setRightDisplayOrders({
      ...rightDisplayOrders,
      [id]: order,
    });
  };

  const handleSubmit = async () => {
    if (!selectedLeft) {
      toast.error("Please select from left section");
      return;
    }

    if (selectedRight.length === 0) {
      toast.error("Please select at least one item from right section");
      return;
    }

    try {
      setSubmitting(true);

      // Send ALL selected items (including original ones)
      const allSelectedItems = selectedRight;

      const payload: Record<string, any> = {};

      // Check if we need to extract additional fields from left section
      if ((leftSection as any).extractFields && selectedLeftObject) {
        const extractFields = (leftSection as any).extractFields;
        const fieldTypes = (leftSection as any)?.fieldTypes || {};

        // Extract examId, gradeId, etc. from the selected left object
        for (const [payloadKey, objectKey] of Object.entries(extractFields)) {
          // Fix: Ensure objectKey is treated as a string key
          const key = objectKey as string;
          const value = (selectedLeftObject as any)[key];
          const fieldType = fieldTypes[payloadKey] || "string";

          // Convert value based on fieldType
          if (fieldType === "number") {
            payload[payloadKey] = Number(value);
          } else if (fieldType === "boolean") {
            payload[payloadKey] = value === "true" || value === true;
          } else {
            payload[payloadKey] = String(value);
          }
        }
        console.log(
          `[DualSectionView] Extracted fields from left section:`,
          extractFields,
          payload
        );
      } else {
        // Default behavior: use fieldName
        payload[leftSection.fieldName] = selectedLeft;
      }

      if (rightSection.selectionType === "multi-select") {
        const rightData = allSelectedItems.map((id) => {
          const item: SelectedData = {};

          // Get the field type from config, default to "string"
          const fieldType =
            (rightSection as any)?.fieldTypes?.[rightSection.optionValueKey] ||
            "string";

          // Convert value based on fieldType
          if (fieldType === "number") {
            item[rightSection.optionValueKey] = parseInt(id, 10);
          } else if (fieldType === "boolean") {
            item[rightSection.optionValueKey] =
              id === "true" || (id as any) === true;
          } else {
            item[rightSection.optionValueKey] = String(id);
          }

          if (rightSection.includeDisplayOrder) {
            const displayOrderType =
              (rightSection as any)?.fieldTypes?.displayOrder || "number";
            const displayOrderValue = rightDisplayOrders[id] || 0;

            if (displayOrderType === "string") {
              (item as any).displayOrder = String(displayOrderValue);
            } else {
              (item as any).displayOrder = Number(displayOrderValue);
            }
          }
          return item;
        });
        payload[rightSection.fieldName] = rightData;
      } else {
        const fieldType =
          (rightSection as any)?.fieldTypes?.[rightSection.optionValueKey] ||
          "string";
        if (fieldType === "number") {
          payload[rightSection.fieldName] = parseInt(selectedRight[0], 10);
        } else if (fieldType === "boolean") {
          payload[rightSection.fieldName] =
            selectedRight[0] === "true" || (selectedRight[0] as any) === true;
        } else {
          payload[rightSection.fieldName] = String(selectedRight[0]);
        }
      }

      console.log(`[DualSectionView] Submitting to ${submitUrl}:`, payload);
      console.log("[DualSectionView] All selected items:", allSelectedItems);
      const response = await apiClient<any>(submitUrl, {
        method,
        body: JSON.stringify(payload),
      });

      console.log("[DualSectionView] Submit response:", response);
      toast.success("Mapping created successfully!");
      if (onSuccess) {
        onSuccess();
      }
      // Reset form
      setSelectedLeft(null);
      setSelectedLeftObject(null);
      setSelectedRight([]);
      setRightDisplayOrders({});
      setOriginalRightOptions([]);
    } catch (error) {
      console.error("Submit failed:", error);
      toast.error("Failed to create mapping. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const leftLabel = leftSection.optionLabelKey;
  const leftValue = leftSection.optionValueKey;
  const rightLabel = rightSection.optionLabelKey;
  const rightValue = rightSection.optionValueKey;

  return (
    <div className="w-full  h-full flex flex-col bg-background">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto ">
        <div className="grid grid-cols-2  gap-6">
          {/* Left Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{leftSection.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {leftSection.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {leftLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder={`Search ${leftSection.placeholder || "items"
                      }...`}
                    value={searchLeft}
                    onChange={(e) => {
                      setSearchLeft(e.target.value);
                      // Reset to page 0 when searching
                      setLeftPageNumber(0);
                    }}
                    className="mb-4"
                  />
                  <div className="max-h-80 overflow-y-auto border rounded p-3 space-y-2 scrollbar-hide">
                    {leftOptions.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        No options available
                      </div>
                    ) : (
                      leftOptions
                        .filter((item) => {
                          const label = String(
                            item[leftLabel] ||
                            item.displayName ||
                            item.name ||
                            ""
                          );
                          return label
                            .toLowerCase()
                            .includes(searchLeft.toLowerCase());
                        })
                        .map((item) => {
                          const label =
                            item[leftLabel] ||
                            item.displayName ||
                            item.name ||
                            "Untitled";
                          const value = String(item[leftValue]);
                          const isSelected =
                            selectedLeft === value ||
                            selectedLeft === String(item[leftValue]);
                          return (
                            <div
                              key={value}
                              onClick={() => {
                                setSelectedLeft(value);
                                setSelectedLeftObject(item);
                              }}
                              className={`p-2 rounded cursor-pointer transition-all ${isSelected
                                ? "bg-cyan-100 border-cyan-500 border text-cyan-900 font-medium"
                                : "border border-transparent"
                                }`}
                            >
                              {label}
                            </div>
                          );
                        })
                    )}
                  </div>

                  {/* Pagination Controls for Left Section */}
                  {leftTotalElements > leftPageSize && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                        Page {leftPageNumber + 1} of{" "}
                        {Math.ceil(leftTotalElements / leftPageSize)} (
                        {leftTotalElements} total)
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchLeftOptions(leftPageNumber - 1)}
                          disabled={leftPageNumber === 0 || leftLoading}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchLeftOptions(leftPageNumber + 1)}
                          disabled={
                            leftPageNumber >=
                            Math.ceil(leftTotalElements / leftPageSize) - 1 ||
                            leftLoading
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{rightSection.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {rightSection.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {rightLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : selectedLeft ? (
                <div className="max-h-80 overflow-y-auto border rounded p-3 space-y-3 scrollbar-hide">
                  {selectedRight.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No options selected. Click "Add Items" to add.
                    </div>
                  ) : (
                    selectedRight.map((value) => {
                      // First check if it's in rightOptions (original items), then check in addedItems (newly added)
                      const item =
                        rightOptions.find(
                          (opt) => String(opt[rightValue]) === value
                        ) || addedItems[value];
                      const label = item
                        ? item[rightLabel] ||
                        item.gradeName ||
                        item.name ||
                        "Untitled"
                        : "Untitled";
                      const isNewlyAdded = !originalRightOptions.some(
                        (opt) => String(opt[rightValue]) === value
                      );

                      console.log("[DualSectionView] Rendering right item:", {
                        value,
                        item,
                        label,
                        isNewlyAdded,
                      });

                      return (
                        <div
                          key={value}
                          draggable
                          onDragStart={() => handleDragStart(value)}
                          onDragOver={(e) => handleDragOver(e, value)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, value)}
                          className={`flex items-center gap-3 p-2 rounded border transition-all ${draggedItemId === value
                            ? "opacity-50 bg-muted"
                            : dragOverItemId === value
                              ? "bg-primary/15 border-primary"
                              : "bg-primary/5 border-primary/20"
                            } cursor-grab active:cursor-grabbing`}
                        >
                          <div className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-sm font-medium">{label}</span>
                            {isNewlyAdded && (
                              <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full font-medium">
                                New
                              </span>
                            )}
                          </div>
                          {rightSection.includeDisplayOrder && (
                            <input
                              type="number"
                              min="1"
                              value={rightDisplayOrders[value] || 0}
                              onChange={(e) =>
                                handleDisplayOrderChange(
                                  value,
                                  parseInt(e.target.value)
                                )
                              }
                              placeholder="Order"
                              className="w-16 px-2 py-1 border rounded text-sm"
                            />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRightItem(value);
                            }}
                            className="p-1 rounded transition-colors text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Remove item"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Select from left section first
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t p-6">
        <div className="flex ml-auto gap-3 items-center justify-end-safe">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.buttonVariant as any}
              disabled={submitting || !selectedLeft}
              onClick={() => {
                if (action.type === "modal") {
                  handleAddItemsClick();
                } else if (action.type === "submit") {
                  handleSubmit();
                } else if (action.type === "copy") {
                  // TODO: Implement copy functionality
                  toast.info("Copy functionality coming soon");
                }
              }}
            >
              <DynamicIcon name={action.icon} className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Add Items Modal */}
      <Dialog
        open={showAddModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setModalSelectedItems(new Set());
            setModalPageNumber(0);
          }
          setShowAddModal(isOpen);
        }}
      >
        <DialogContent className="max-w-2xl flex flex-col max-h-[80vh]">
          <DialogHeader>
            {(() => {
              const addAction = actions.find((a) => a.type === "modal");
              return (
                <>
                  <DialogTitle>
                    {addAction?.modalTitle || "Select Items to Add"}
                  </DialogTitle>
                  <DialogDescription>
                    {addAction?.modalDescription}
                  </DialogDescription>
                </>
              );
            })()}
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {modalLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                {allModalOptions.map((item) => {
                  const addAction = actions.find((a) => a.type === "modal");
                  const modalValueKey = addAction?.modalOptionValueKey || "id";
                  const modalLabelKey =
                    addAction?.modalOptionLabelKey || "name";
                  const itemId = String(item[modalValueKey]);
                  const itemLabel =
                    item[modalLabelKey] ||
                    item.displayName ||
                    item.name ||
                    `Item ${itemId}`;

                  // Check if already mapped in original
                  const isMapped = originalRightOptions.some(
                    (rItem) =>
                      String(rItem[rightSection.optionValueKey]) === itemId
                  );
                  // Check if selected in modal
                  const isSelected = modalSelectedItems.has(itemId);
                  // Check if already in selectedRight
                  const isAlreadyAdded = selectedRight.includes(itemId);

                  return (
                    <button
                      key={itemId}
                      onClick={() => {
                        const newSet = new Set(modalSelectedItems);
                        if (newSet.has(itemId)) {
                          newSet.delete(itemId);
                        } else {
                          newSet.add(itemId);
                        }
                        setModalSelectedItems(newSet);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors ${isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-accent"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{itemLabel}</span>
                        <div className="flex gap-2 items-center">
                          {isMapped && !isAlreadyAdded && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              Mapped
                            </span>
                          )}
                          {isAlreadyAdded && (
                            <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-600 rounded-full font-medium">
                              Already Added
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-primary font-bold">✓</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!modalLoading && modalTotalPages > 1 && (
            <div className="border-t pt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {modalTotalElements} items
              </span>
              <div className="flex gap-2 items-center">
                <span className="text-muted-foreground">
                  Page {modalPageNumber + 1} of {modalTotalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleAddItemsClick(Math.max(0, modalPageNumber - 1))
                  }
                  disabled={modalPageNumber === 0}
                  className="h-8 w-8 p-0"
                >
                  ←
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleAddItemsClick(
                      Math.min(modalTotalPages - 1, modalPageNumber + 1)
                    )
                  }
                  disabled={modalPageNumber >= modalTotalPages - 1}
                  className="h-8 w-8 p-0"
                >
                  →
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setModalSelectedItems(new Set());
                setShowAddModal(false);
                setModalPageNumber(0);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleAddSelectedItems(Array.from(modalSelectedItems));
                setModalSelectedItems(new Set());
              }}
              disabled={modalSelectedItems.size === 0}
            >
              Add Selected ({modalSelectedItems.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Existing Item</DialogTitle>
            <DialogDescription>
              This item already exists in the system. Are you sure you want to
              delete it? You can recover it by re-adding it later if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground">
              This action will remove the item from the mapping and cannot be
              undone immediately. However, you can always re-add it if you
              change your mind.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteItemId(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete It"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
