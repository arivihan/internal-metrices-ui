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

import {
  uploadChapter,
  fetchExams,
  fetchGrades,
  fetchStreams,
  fetchBatches,
  fetchBatchAddOns,
  fetchLanguages,
  fetchExamGradeMappings,
  fetchExamGradeStreamMappings,
  fetchAllBatches,
  fetchAllBatchAddOns,
} from "@/services/chapters";
import type { FilterOption } from "@/types/chapters";
import { ConfirmChapterUploadDialog } from "./ConfirmChapterUploadDialog";

interface AddChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  file: File | null;
  examId: number | null;
  gradeId: number | null;
  streamId: number | null;
  batchId: number | null;
  batchAddOnId: number | null;
  language: string;
}

export function AddChapterDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddChapterDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    file: null,
    examId: null,
    gradeId: null,
    streamId: null,
    batchId: null,
    batchAddOnId: null,
    language: "English",
  });

  // Filter options - All data fetched upfront
  const [exams, setExams] = useState<FilterOption[]>([]);
  const [grades, setGrades] = useState<FilterOption[]>([]);
  const [streams, setStreams] = useState<FilterOption[]>([]);
  const [batches, setBatches] = useState<FilterOption[]>([]);
  const [batchAddOns, setBatchAddOns] = useState<FilterOption[]>([]);
  const [languages, setLanguages] = useState<FilterOption[]>([]);

  // Mapping data for filtering
  const [examGradeMappings, setExamGradeMappings] = useState<any[]>([]);
  const [examGradeStreamMappings, setExamGradeStreamMappings] = useState<any[]>(
    []
  );
  const [allBatches, setAllBatches] = useState<FilterOption[]>([]);
  const [allBatchAddOns, setAllBatchAddOns] = useState<FilterOption[]>([]);

  // Filtered options based on selections
  const [filteredGrades, setFilteredGrades] = useState<FilterOption[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<FilterOption[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<FilterOption[]>([]);
  const [filteredBatchAddOns, setFilteredBatchAddOns] = useState<
    FilterOption[]
  >([]);

  // Load filter options - Fetch ALL data upfront
  useEffect(() => {
    if (open) {
      loadAllFilterOptions();
    }
  }, [open]);

  // Filter grades based on selected exam
  useEffect(() => {
    if (formData.examId && examGradeMappings.length > 0) {
      const examGrades = examGradeMappings.filter(
        (mapping) => mapping.examId === formData.examId
      );
      const gradeIds = examGrades.map((mapping) => mapping.gradeId);
      const filtered = grades.filter((grade) => gradeIds.includes(grade.id));
      setFilteredGrades(filtered);
    } else {
      setFilteredGrades([]);
      setFormData((prev) => ({
        ...prev,
        gradeId: null,
        streamId: null,
        batchId: null,
        batchAddOnId: null,
      }));
    }
  }, [formData.examId, examGradeMappings, grades]);

  // Filter streams based on selected exam and grade
  useEffect(() => {
    if (
      formData.examId &&
      formData.gradeId &&
      examGradeStreamMappings.length > 0
    ) {
      const examGradeStreams = examGradeStreamMappings.filter(
        (mapping) =>
          mapping.examId === formData.examId &&
          mapping.gradeId === formData.gradeId
      );
      const streamIds = examGradeStreams.map((mapping) => mapping.streamId);
      const filtered = streams.filter((stream) =>
        streamIds.includes(stream.id)
      );
      setFilteredStreams(filtered);
    } else {
      setFilteredStreams([]);
      setFormData((prev) => ({
        ...prev,
        streamId: null,
        batchId: null,
        batchAddOnId: null,
      }));
    }
  }, [formData.examId, formData.gradeId, examGradeStreamMappings, streams]);

  // Filter batches based on exam, grade, stream
  useEffect(() => {
    if (
      formData.examId &&
      formData.gradeId &&
      formData.streamId &&
      allBatches.length > 0
    ) {
      // Filter batches that match exam, grade, stream combination
      const filtered = allBatches.filter((batch) => {
        // Assuming batch has examId, gradeId, streamId properties
        return (
          batch.examId === formData.examId &&
          batch.gradeId === formData.gradeId &&
          batch.streamId === formData.streamId
        );
      });
      setFilteredBatches(filtered);
    } else {
      setFilteredBatches([]);
      setFormData((prev) => ({ ...prev, batchId: null, batchAddOnId: null }));
    }
  }, [formData.examId, formData.gradeId, formData.streamId, allBatches]);

  // Filter batch add-ons based on selected batch
  useEffect(() => {
    if (formData.batchId && allBatchAddOns.length > 0) {
      const filtered = allBatchAddOns.filter(
        (addon) => addon.batchId === formData.batchId
      );
      setFilteredBatchAddOns(filtered);
    } else {
      setFilteredBatchAddOns([]);
      setFormData((prev) => ({ ...prev, batchAddOnId: null }));
    }
  }, [formData.batchId, allBatchAddOns]);

  const loadAllFilterOptions = async () => {
    setLoading(true);
    try {
      // Fetch all basic data
      const [examsRes, gradesRes, streamsRes, languagesRes] = await Promise.all(
        [
          fetchExams({ active: true }),
          fetchGrades({ active: true }),
          fetchStreams({ active: true }),
          fetchLanguages(),
        ]
      );

      // Fetch all mapping data
      const [
        examGradeMappingsRes,
        examGradeStreamMappingsRes,
        allBatchesRes,
        allBatchAddOnsRes,
      ] = await Promise.all([
        fetchExamGradeMappings(),
        fetchExamGradeStreamMappings(),
        fetchAllBatches({ activeFlag: true }),
        fetchAllBatchAddOns(),
      ]);

      // Set basic data
      setExams(Array.isArray(examsRes) ? examsRes : (examsRes as any).content || []);
      setGrades(Array.isArray(gradesRes) ? gradesRes : (gradesRes as any).content || []);
      setStreams(Array.isArray(streamsRes) ? streamsRes : (streamsRes as any).content || []);
      setLanguages(Array.isArray(languagesRes) ? languagesRes : (languagesRes as any) || []);

      // Set mapping data
      setExamGradeMappings(
        Array.isArray(examGradeMappingsRes) ? examGradeMappingsRes : (examGradeMappingsRes as any).content || []
      );
      setExamGradeStreamMappings(
        Array.isArray(examGradeStreamMappingsRes) ? examGradeStreamMappingsRes : (examGradeStreamMappingsRes as any).content || []
      );
      setAllBatches(
        Array.isArray(allBatchesRes) ? allBatchesRes : (allBatchesRes as any).content || []
      );
      setAllBatchAddOns(
        Array.isArray(allBatchAddOnsRes) ? allBatchAddOnsRes : (allBatchAddOnsRes as any).content || []
      );
    } catch (error) {
      console.error("Failed to load filter options:", error);
      toast.error("Failed to load options");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setFormData({
        file: null,
        examId: null,
        gradeId: null,
        streamId: null,
        batchId: null,
        batchAddOnId: null,
        language: "English",
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
      // Accept Excel, CSV, and OLE2 (legacy Office) files
      const validTypes = [
        // Modern Excel formats
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        // CSV formats
        "text/csv",
        "application/csv",
        "text/plain", // Sometimes CSV files have this MIME type

        // OLE2 / Legacy Microsoft Office formats
        "application/msword", // .doc files
        "application/vnd.ms-word", // Alternative MIME for .doc
        "application/x-msexcel", // Legacy Excel
        "application/x-ms-excel", // Alternative Excel MIME
        "application/excel", // Another Excel MIME
        "application/x-excel", // Yet another Excel MIME
        "application/x-dos_ms_excel", // DOS Excel
        "application/xls", // Simple .xls MIME

        // Generic binary formats that might be OLE2
        "application/octet-stream", // Generic binary
        "application/x-ole-storage", // OLE2 storage
      ];

      const validExtensions = /\.(xlsx|xls|csv|doc)$/i;
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.test(file.name);

      // File must have either valid MIME type OR valid extension
      if (!hasValidType && !hasValidExtension) {
        toast.error(
          "Please upload a valid Excel, CSV, or OLE2 document file (.xlsx, .xls, .csv, .doc)"
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Additional validation for file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        toast.error("File size must be less than 50MB");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Detect file type for user feedback
      const isCSV =
        file.name.toLowerCase().endsWith(".csv") ||
        file.type === "text/csv" ||
        file.type === "application/csv";

      const isLegacyExcel =
        file.name.toLowerCase().endsWith(".xls") ||
        file.type.includes("ms-excel") ||
        file.type.includes("msexcel") ||
        file.type === "application/excel";

      const isModernExcel =
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const isOLE2 =
        file.type === "application/octet-stream" ||
        file.type === "application/x-ole-storage" ||
        file.name.toLowerCase().endsWith(".doc");

      console.log("Selected file:", {
        name: file.name,
        type: file.type,
        size: file.size,
        hasValidType,
        hasValidExtension,
        isCSV,
        isLegacyExcel,
        isModernExcel,
        isOLE2,
      });

      // Show info about file type
      if (isCSV) {
        toast.info(
          "CSV file detected - make sure it follows the required format"
        );
      } else if (isLegacyExcel) {
        toast.info("Legacy Excel (.xls) file detected - OLE2 format supported");
      } else if (isModernExcel) {
        toast.info("Modern Excel (.xlsx) file detected");
      } else if (isOLE2) {
        toast.info("OLE2 document detected - legacy Office format supported");
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
      toast.error(
        "Please select an Excel, CSV, or OLE2 document file to upload"
      );
      return false;
    }

    // Validate: if any of exam, grade, stream, batch, batchAddOn is provided, all must be provided or none
    const hasAnyMapping =
      formData.examId ||
      formData.gradeId ||
      formData.streamId ||
      formData.batchId ||
      formData.batchAddOnId;

    if (hasAnyMapping) {
      if (!formData.examId) {
        toast.error("Exam is required when providing mapping details");
        return false;
      }
      if (!formData.gradeId) {
        toast.error("Grade is required when providing mapping details");
        return false;
      }
      if (!formData.streamId) {
        toast.error("Stream is required when providing mapping details");
        return false;
      }
      if (!formData.batchId) {
        toast.error("Batch is required when providing mapping details");
        return false;
      }
      // batchAddOnId is optional even when other mapping fields are provided
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // First API call - Upload and get preview
      const response = await uploadChapter({
        file: formData.file!,
        examId: formData.examId || undefined,
        gradeId: formData.gradeId || undefined,
        streamId: formData.streamId || undefined,
        batchId: formData.batchId || undefined,
        batchAddOnId: formData.batchAddOnId || undefined,
        language: formData.language || undefined,
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
          error instanceof Error ? error.message : "Failed to upload chapters",
        errors: [error instanceof Error ? error.message : "Unknown error"],
        datas: [],
      };
      setUploadPreview(errorResponse);
      setShowConfirmation(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setUploadPreview(null);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Upload Chapters</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>
              Excel/CSV/OLE2 File <span className="text-destructive">*</span>
            </Label>
            {!formData.file ? (
              <div
                onClick={handleDropzoneClick}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 transition-colors hover:border-muted-foreground/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.doc,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/csv,application/msword,application/octet-stream"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="mb-3 size-10 text-muted-foreground/50" />
                <p className="font-medium">Upload Excel/CSV/OLE2 File</p>
                <p className="text-sm text-muted-foreground">
                  Accepted formats: .xlsx, .xls, .csv, .doc (OLE2)
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

          {/* Mapping Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Mapping Details (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                If you want to automatically map uploaded chapters, provide all
                mapping details below. Otherwise, leave them empty.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Exam */}
              <div className="space-y-2">
                <Label htmlFor="exam">Exam</Label>
                <Select
                  value={formData.examId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      examId: value ? Number(value) : null,
                    }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="exam">
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={String(exam.id)}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={formData.gradeId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      gradeId: value ? Number(value) : null,
                    }))
                  }
                  disabled={!formData.examId || loading}
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredGrades.map((grade) => (
                      <SelectItem key={grade.id} value={String(grade.id)}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stream */}
              <div className="space-y-2">
                <Label htmlFor="stream">Stream</Label>
                <Select
                  value={formData.streamId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      streamId: value ? Number(value) : null,
                    }))
                  }
                  disabled={!formData.examId || !formData.gradeId || loading}
                >
                  <SelectTrigger id="stream">
                    <SelectValue placeholder="Select Stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStreams.map((stream) => (
                      <SelectItem key={stream.id} value={String(stream.id)}>
                        {stream.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch */}
              <div className="space-y-2">
                <Label htmlFor="batch">Batch</Label>
                <Select
                  value={formData.batchId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      batchId: value ? Number(value) : null,
                    }))
                  }
                  disabled={
                    !formData.examId || !formData.gradeId || !formData.streamId
                  }
                >
                  <SelectTrigger id="batch">
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBatches.map((batch) => (
                      <SelectItem key={batch.id} value={String(batch.id)}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Add-on */}
              <div className="space-y-2">
                <Label htmlFor="batchAddon">Batch Add-on (Optional)</Label>
                <Select
                  value={formData.batchAddOnId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      batchAddOnId: value ? Number(value) : null,
                    }))
                  }
                  disabled={!formData.batchId}
                >
                  <SelectTrigger id="batchAddon">
                    <SelectValue placeholder="Select Batch Add-on" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBatchAddOns.map((addon) => (
                      <SelectItem key={addon.id} value={String(addon.id)}>
                        {addon.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, language: value }))
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.length > 0 ? (
                      languages.map((lang) => (
                        <SelectItem key={lang.id} value={String(lang.id)}>
                          {lang.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.file}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Preview Upload
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Confirmation Dialog */}
      <ConfirmChapterUploadDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        uploadPreview={uploadPreview}
        formData={formData}
        exams={exams}
        filteredGrades={filteredGrades}
        filteredStreams={filteredStreams}
        filteredBatches={filteredBatches}
        filteredBatchAddOns={filteredBatchAddOns}
        onSuccess={() => {
          onSuccess();
          handleClose();
        }}
        onClose={handleConfirmationClose}
      />
    </Sheet>
  );
}
