import { useState, useRef, useEffect } from "react";
import { Upload, Loader2, X, ChevronDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

import { uploadNotes, fetchBatchesPaginated } from "@/services/notes";
import type { BatchOption } from "@/types/notes";

interface AddNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  file: File | null;
  batchId: number | null;
}

export function AddNotesDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddNotesDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    file: null,
    batchId: null,
  });

  // Batch options with pagination
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [selectedBatchName, setSelectedBatchName] = useState("");
  const [batchPagination, setBatchPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load batch options
  useEffect(() => {
    if (open) {
      loadBatchOptions(0, "");
    }
  }, [open]);

  const loadBatchOptions = async (pageNo: number = 0, search: string = "") => {
    setLoading(true);
    try {
      console.log("[AddNotesDialog] Loading batch options...");
      const response = await fetchBatchesPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        activeFlag: true,
      });

      // Use mapped batches from the service
      setBatches(response.content as BatchOption[]);
      setBatchPagination({
        currentPage: response.pageNumber,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        pageSize: response.pageSize,
      });

      console.log("[AddNotesDialog] Batch options loaded:", response.content.length, "items");
    } catch (error) {
      console.error("[AddNotesDialog] Failed to load batch options:", error);
      toast.error(
        "Failed to load batch options: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSearch = (query: string) => {
    setBatchSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadBatchOptions(0, query);
    }, 300);
  };

  const handlePrevBatchPage = () => {
    if (batchPagination.currentPage > 0) {
      loadBatchOptions(batchPagination.currentPage - 1, batchSearchQuery);
    }
  };

  const handleNextBatchPage = () => {
    if (batchPagination.currentPage < batchPagination.totalPages - 1) {
      loadBatchOptions(batchPagination.currentPage + 1, batchSearchQuery);
    }
  };

  const handleBatchSelect = (batch: BatchOption) => {
    setFormData((prev) => ({ ...prev, batchId: batch.id }));
    setSelectedBatchName(batch.name);
    setBatchDropdownOpen(false);
  };

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setFormData({
        file: null,
        batchId: null,
      });
      setSelectedBatchName("");
      setBatchSearchQuery("");
    }
  }, [open]);

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Accept common document formats
      const validTypes = [
        // PDF
        "application/pdf",

        // Excel formats
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        // Word formats
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        // PowerPoint formats
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        // Images
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",

        // Text formats
        "text/plain",
        "text/csv",

        // Generic binary
        "application/octet-stream",
      ];

      const validExtensions =
        /\.(pdf|xlsx?|docx?|pptx?|jpe?g|png|gif|webp|txt|csv)$/i;
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.test(file.name);

      // File must have either valid MIME type OR valid extension
      if (!hasValidType && !hasValidExtension) {
        toast.error(
          "Please upload a valid document file (PDF, Word, Excel, PowerPoint, or Image)"
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Additional validation for file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        toast.error("File size must be less than 100MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      console.log("Selected file:", {
        name: file.name,
        type: file.type,
        size: file.size,
        hasValidType,
        hasValidExtension,
      });

      // Show info about file type
      if (file.type === "application/pdf") {
        toast.info("PDF file detected");
      } else if (
        file.type.includes("excel") ||
        file.name.toLowerCase().endsWith(".xlsx")
      ) {
        toast.info("Excel file detected");
      } else if (
        file.type.includes("word") ||
        file.name.toLowerCase().endsWith(".docx")
      ) {
        toast.info("Word document detected");
      } else if (
        file.type.includes("powerpoint") ||
        file.name.toLowerCase().endsWith(".pptx")
      ) {
        toast.info("PowerPoint presentation detected");
      } else if (file.type.startsWith("image/")) {
        toast.info("Image file detected");
      }

      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    if (!formData.file) {
      toast.error("Please select a file to upload");
      return false;
    }

    if (!formData.batchId) {
      toast.error("Please select a batch");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Upload notes and get response - saves directly without confirmation
      const response = await uploadNotes({
        file: formData.file!,
        batchId: formData.batchId!,
      });

      console.log("Upload response received:", response);

      // Show success and close dialog directly
      toast.success(response?.message || "Notes uploaded successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload notes"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Upload Notes</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Batch Selection */}
          <div className="space-y-2">
            <Label htmlFor="batch">
              Select Batch <span className="text-destructive">*</span>
            </Label>
            <Popover
              open={batchDropdownOpen}
              onOpenChange={setBatchDropdownOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedBatchName || "Choose a batch..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-100 p-0"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search batches..."
                    value={batchSearchQuery}
                    onChange={(e) => handleBatchSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="max-h-100 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading...</span>
                    </div>
                  ) : batches.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No batches found.
                    </div>
                  ) : (
                    <>
                      {batches.map((batch) => (
                        <div
                          key={batch.id}
                          className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                          onClick={() => handleBatchSelect(batch)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 shrink-0 ${
                              formData.batchId === batch.id
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium truncate">
                              {batch.name}
                            </span>
                            {batch.examName && batch.gradeName && (
                              <span className="text-xs text-muted-foreground truncate">
                                {batch.examName} • {batch.gradeName} •{" "}
                                {batch.language}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {/* Pagination Controls */}
                {batchPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-2 border-t bg-background">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevBatchPage}
                      disabled={loading || batchPagination.currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {batchPagination.currentPage + 1} of{" "}
                      {batchPagination.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextBatchPage}
                      disabled={
                        loading ||
                        batchPagination.currentPage >=
                          batchPagination.totalPages - 1
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          {/* File Upload */}
          <div className="space-y-2">
            <Label>
              Notes File <span className="text-destructive">*</span>
            </Label>
            {!formData.file ? (
              <div
                onClick={handleDropzoneClick}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 transition-colors hover:border-muted-foreground/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*,text/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="mb-3 size-10 text-muted-foreground/50" />
                <p className="font-medium">Upload Notes File</p>
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, Word, Excel, PowerPoint, Images
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Upload className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{formData.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(formData.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="size-8"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.file || !formData.batchId}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Upload Notes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
