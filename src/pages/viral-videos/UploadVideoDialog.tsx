import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Loader2,
  X,
  Video,
  FileVideo,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

import {
  uploadViralVideos,
  fetchAllBatchesForVideos,
} from "@/services/viralVideos";
import type { BatchOption } from "@/types/viralVideos";

interface UploadVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

interface FormData {
  files: FileWithPreview[];
  batchId: number | null;
}

export function UploadVideoDialog({
  open,
  onOpenChange,
  onSuccess,
}: UploadVideoDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    files: [],
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
      console.log("[UploadVideoDialog] Loading batch options...");
      const batchesRes = await fetchAllBatchesForVideos({ activeFlag: true });
      console.log("[UploadVideoDialog] Batch options loaded:", batchesRes);
      setBatches(batchesRes);

      if (batchesRes.length === 0) {
        toast.warning("No active batches found");
      }
    } catch (error) {
      console.error("[UploadVideoDialog] Failed to load batch options:", error);
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
        files: [],
        batchId: null,
      });
      setUploadProgress(0);
    }
  }, [open]);

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const maxSize = 500 * 1024 * 1024; // 500MB per file
    const validTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    const validExtensions = /\.(mp4|webm|mov|avi|mkv)$/i;

    files.forEach((file) => {
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.test(file.name);

      if (!hasValidType && !hasValidExtension) {
        toast.error(
          `${file.name}: Invalid format. Please upload video files only.`
        );
        return;
      }

      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than 500MB`);
        return;
      }

      validFiles.push(file);
    });

    return validFiles;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        const filesWithPreviews = validFiles.map((file) => {
          const fileWithPreview = file as FileWithPreview;
          fileWithPreview.preview = URL.createObjectURL(file);
          return fileWithPreview;
        });

        setFormData((prev) => ({
          ...prev,
          files: [...prev.files, ...filesWithPreviews],
        }));

        toast.success(`${validFiles.length} video(s) added`);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = validateFiles(files);

      if (validFiles.length > 0) {
        const filesWithPreviews = validFiles.map((file) => {
          const fileWithPreview = file as FileWithPreview;
          fileWithPreview.preview = URL.createObjectURL(file);
          return fileWithPreview;
        });

        setFormData((prev) => ({
          ...prev,
          files: [...prev.files, ...filesWithPreviews],
        }));

        toast.success(`${validFiles.length} video(s) added`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => {
      const newFiles = [...prev.files];
      // Revoke the preview URL
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return { ...prev, files: newFiles };
    });
  };

  const handleClearAllFiles = () => {
    formData.files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFormData((prev) => ({ ...prev, files: [] }));
  };

  const validateForm = (): boolean => {
    if (formData.files.length === 0) {
      toast.error("Please select at least one video to upload");
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
    setUploadProgress(10);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await uploadViralVideos({
        files: formData.files,
        batchId: formData.batchId!,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log("Upload response received:", response);
      setUploadPreview(response);
      setShowConfirmation(true);
    } catch (error) {
      console.error("Upload error:", error);
      const errorResponse = {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to upload videos",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
      setUploadPreview(errorResponse);
      setShowConfirmation(true);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleConfirmSave = async () => {
    if (uploadPreview?.success || uploadPreview?.message) {
      toast.success(uploadPreview.message || "Videos uploaded successfully");
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-rose-500" />
            Upload Viral Videos
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
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
                <SelectValue placeholder="Choose a batch for these videos" />
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

          {/* File Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Video Files <span className="text-destructive">*</span>
              </Label>
              {formData.files.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFiles}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Drag and Drop Zone */}
            <div
              onClick={handleDropzoneClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-all ${
                isDragging
                  ? "border-rose-500 bg-rose-50"
                  : "border-muted-foreground/25 hover:border-rose-300 hover:bg-rose-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi,.mkv"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <FileVideo
                className={`mb-3 size-12 ${
                  isDragging ? "text-rose-500" : "text-muted-foreground/50"
                }`}
              />
              <p className="font-medium text-center">
                {isDragging
                  ? "Drop your videos here"
                  : "Drag & drop videos or click to browse"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Supported formats: MP4, WebM, MOV, AVI (max 500MB each)
              </p>
            </div>

            {/* Upload Progress */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Selected Files List */}
            {formData.files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {formData.files.length} video(s) selected
                </Label>
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-3 space-y-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {file.preview ? (
                            <video
                              src={file.preview}
                              className="h-10 w-14 object-cover rounded"
                              muted
                            />
                          ) : (
                            <div className="h-10 w-14 bg-rose-100 rounded flex items-center justify-center">
                              <Video className="h-5 w-5 text-rose-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Upload Guidelines */}
          <div className="rounded-lg border bg-amber-50 p-4">
            <h4 className="text-sm font-medium text-amber-800 mb-2">
              Upload Guidelines
            </h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Use MP4 format with H.264 codec for best compatibility</li>
              <li>• Portrait videos (9:16) work best for mobile viewing</li>
              <li>• Keep videos under 60 seconds for viral content</li>
              <li>• Ensure good thumbnail visibility in the first frame</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || formData.files.length === 0 || !formData.batchId
            }
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Upload{" "}
                {formData.files.length > 0
                  ? `${formData.files.length} Video(s)`
                  : "Videos"}
              </>
            )}
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
            <DialogTitle className="flex items-center gap-2">
              {uploadPreview?.error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {uploadPreview?.error
                ? "Upload Issues Detected"
                : "Upload Successful"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {uploadPreview?.error
                ? "Some issues were detected during upload. Review the details below."
                : "Your videos have been uploaded successfully."}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Card */}
            <div
              className={`rounded-lg border p-4 ${
                uploadPreview?.error
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <strong>Files Uploaded:</strong> {formData.files.length}
                </div>
                <div>
                  <strong>Batch:</strong>{" "}
                  {batches.find((b) => b.id === formData.batchId)?.name ||
                    "Unknown"}
                </div>
                <div>
                  <strong>Total Size:</strong>{" "}
                  {formatFileSize(
                    formData.files.reduce((acc, f) => acc + f.size, 0)
                  )}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {uploadPreview?.error ? (
                    <span className="text-red-600 font-medium">
                      Needs Review
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">Complete</span>
                  )}
                </div>
              </div>

              {uploadPreview?.message && (
                <div
                  className={`mt-3 p-2 rounded text-sm ${
                    uploadPreview?.error
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <strong>Response:</strong> {uploadPreview.message}
                </div>
              )}
            </div>

            {/* View Full Details Toggle */}
            <div className="border rounded-lg">
              <button
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="w-full p-3 text-left flex items-center justify-between"
              >
                <span className="font-medium text-sm">
                  View Full Response Details
                </span>
                <span className="text-xs text-gray-500">
                  {showFullDetails ? "▼ Hide" : "▶ Show"}
                </span>
              </button>

              {showFullDetails && (
                <div className="border-t p-4 max-h-60 overflow-y-auto">
                  <pre className="text-xs  p-3 rounded whitespace-pre-wrap break-words">
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
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
