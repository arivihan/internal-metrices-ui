import { useState, useRef, useEffect } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { uploadNotes, fetchAllBatchesForNotes } from "@/services/notes";
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    file: null,
    batchId: null,
  });

  // Batch options
  const [batches, setBatches] = useState<BatchOption[]>([]);

  // Load batch options
  useEffect(() => {
    if (open) {
      loadBatchOptions();
    }
  }, [open]);

  const loadBatchOptions = async () => {
    setLoading(true);
    try {
      console.log("[AddNotesDialog] Loading batch options...");
      const batchesRes = await fetchAllBatchesForNotes({ activeFlag: true });
      console.log("[AddNotesDialog] Batch options loaded:", batchesRes);
      setBatches(batchesRes);

      if (batchesRes.length === 0) {
        toast.warning("No active batches found");
      } else {
        console.log(
          "[AddNotesDialog] Set batches:",
          batchesRes.length,
          "items"
        );
      }
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

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setFormData({
        file: null,
        batchId: null,
      });
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
      // Upload notes and get response
      const response = await uploadNotes({
        file: formData.file!,
        batchId: formData.batchId!,
      });

      // Always show confirmation popup regardless of success/failure
      console.log("Upload response received:", response);
      setUploadPreview(response);
      setShowConfirmation(true);
    } catch (error) {
      console.error("Upload error:", error);
      // Even on error, show the confirmation with error details
      const errorResponse = {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to upload notes",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
      setUploadPreview(errorResponse);
      setShowConfirmation(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSave = async () => {
    // For notes, the upload API directly saves the notes
    // So we just need to show success and close
    if (uploadPreview?.success || uploadPreview?.message) {
      toast.success(uploadPreview.message || "Notes uploaded successfully");
      onSuccess();
      handleClose();
      setShowConfirmation(false);
      setShowFullDetails(false);
      setUploadPreview(null);
    } else {
      toast.error(uploadPreview?.message || "Upload failed");
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setShowFullDetails(false);
    setUploadPreview(null);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Upload Notes</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
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

          {/* Batch Selection */}
          <div className="space-y-2">
            <Label htmlFor="batch">
              Select Batch <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.batchId?.toString() || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  batchId: value ? Number(value) : null,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger id="batch">
                <SelectValue placeholder="Choose a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={String(batch.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{batch.name}</span>
                      {batch.examName && batch.gradeName && (
                        <span className="text-xs text-muted-foreground">
                          {batch.examName} • {batch.gradeName} •{" "}
                          {batch.language}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmation}
        onOpenChange={() => !isSubmitting && handleCancelConfirmation()}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📝 Confirm Notes Upload</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Upload processing completed. Review the summary and click
              "Confirm" to finalize.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Minimal Summary */}
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                {uploadPreview?.error ? (
                  <span className="text-red-600">
                    ❌ Upload Issues Detected
                  </span>
                ) : (
                  <span className="text-green-600">✅ Upload Processed</span>
                )}
              </h4>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <strong>File:</strong> {formData.file?.name}
                </div>
                <div>
                  <strong>Size:</strong>{" "}
                  {formData.file
                    ? (formData.file.size / 1024).toFixed(1) + " KB"
                    : "N/A"}
                </div>
                <div>
                  <strong>Batch:</strong>{" "}
                  {batches.find((b) => b.id === formData.batchId)?.name ||
                    "Unknown"}
                </div>
                <div>
                  <strong>Status:</strong>
                  {uploadPreview?.error ? (
                    <span className="text-red-600 font-medium">
                      Needs Review
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      Ready to Save
                    </span>
                  )}
                </div>
              </div>

              {uploadPreview?.message && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Response:</strong> {uploadPreview.message}
                </div>
              )}

              {uploadPreview?.errors && uploadPreview.errors.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                  <strong>Issues:</strong>{" "}
                  {uploadPreview.errors.slice(0, 2).join(", ")}
                  {uploadPreview.errors.length > 2 &&
                    ` (and ${uploadPreview.errors.length - 2} more)`}
                </div>
              )}
            </div>

            {/* View Full Details Toggle */}
            <div className="border rounded-lg">
              <button
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="font-medium text-sm">
                  🔍 View Full Response Details
                </span>
                <span className="text-xs text-gray-500">
                  {showFullDetails ? "▼ Hide" : "▶ Show"}
                </span>
              </button>

              {showFullDetails && (
                <div className="border-t p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs bg-gray-100 p-3 rounded whitespace-pre-wrap break-words">
                    {JSON.stringify(uploadPreview, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelConfirmation}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              📝 Confirm Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
