import { useState } from "react";
import {
  Loader2,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { saveChapterUpload } from "@/services/chapters";
import type { FilterOption } from "@/types/chapters";

interface FormData {
  file: File | null;
  examId: number | null;
  gradeId: number | null;
  streamId: number | null;
  batchId: number | null;
  batchAddOnId: number | null;
  language: string;
}

interface ConfirmChapterUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadPreview: any;
  formData: FormData;
  exams: FilterOption[];
  filteredGrades: FilterOption[];
  filteredStreams: FilterOption[];
  filteredBatches: FilterOption[];
  filteredBatchAddOns: FilterOption[];
  onSuccess: () => void;
  onClose: () => void;
}

export function ConfirmChapterUploadDialog({
  open,
  onOpenChange,
  uploadPreview,
  formData,
  exams,
  filteredGrades,
  filteredStreams,
  filteredBatches,
  filteredBatchAddOns,
  onSuccess,
  onClose,
}: ConfirmChapterUploadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set()
  );
  const [expandedMicroLectures, setExpandedMicroLectures] = useState<
    Set<string>
  >(new Set());
  const [selectedDetailView, setSelectedDetailView] = useState<{
    type: 'questions' | 'doubts' | 'videoPreviews' | 'factoryshipCQNQs';
    data: any[];
    title: string;
    microLectureCode: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleConfirmSave = async () => {
    if (!uploadPreview) return;

    setIsSubmitting(true);
    try {
      const saveResponse = await saveChapterUpload(uploadPreview);

      console.log("Save response received:", saveResponse);

      if (saveResponse.success) {
        toast.success(saveResponse.message || "Chapters saved successfully");

        if (saveResponse.uploadedChapters) {
          toast.success(`✅ ${saveResponse.uploadedChapters}`, {
            duration: 5000,
            position: "top-center",
          });
        }

        if (saveResponse.mappedChapters) {
          toast.info(`📋 ${saveResponse.mappedChapters}`, {
            duration: 4000,
          });
        }

        if (
          saveResponse.failedChapters &&
          saveResponse.failedChapters !== "Chapters Upload Failed"
        ) {
          toast.warning(`⚠️ ${saveResponse.failedChapters}`, {
            duration: 6000,
          });
        }

        onSuccess();
        handleClose();
      } else {
        toast.error(saveResponse.message || "Failed to save chapters");
        if (saveResponse.errorDetails) {
          toast.error(saveResponse.errorDetails);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save chapters"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    onOpenChange(false);
    setShowFullDetails(false);
    setExpandedChapters(new Set());
    setExpandedMicroLectures(new Set());
  };

  const handleCancelConfirmation = () => {
    handleClose();
  };

  const toggleChapterExpansion = (index: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleMicroLectureExpansion = (key: string) => {
    const newExpanded = new Set(expandedMicroLectures);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedMicroLectures(newExpanded);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelConfirmation}
                disabled={isSubmitting}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  📋 Confirm Chapter Upload
                </h1>
                <p className="text-muted-foreground">
                  Upload processing completed. Review the data and click "Save"
                  to finalize.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                className="bg-green-600 hover:bg-green-700 text-white px-8"
                size="lg"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Saving..." : "Save Upload"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="container max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
          {/* Summary Section */}
          <div className="rounded-lg border p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              {uploadPreview?.error ? (
                <span className="text-red-600"> Upload Issues Detected</span>
              ) : (
                <span className="text-green-600"> Upload Processed</span>
              )}
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">File</div>
                <div className="font-medium wrap-break-word mt-1">
                  {formData.file?.name}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Size</div>
                <div className="font-medium mt-1">
                  {formData.file
                    ? (formData.file.size / 1024).toFixed(1) + " KB"
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Subject</div>
                <div className="font-medium mt-1">
                  {uploadPreview?.subject || "Auto-detected"}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">
                  Language
                </div>
                <div className="font-medium mt-1">
                  {uploadPreview?.language || formData.language}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">
                  Chapters Found
                </div>
                <div className="font-medium mt-1">
                  {uploadPreview?.datas?.length || 0}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Status</div>
                <div className="font-medium mt-1">
                  {uploadPreview?.error ? (
                    <span className="text-red-600">Needs Review</span>
                  ) : (
                    <span className="text-green-600">Ready to Save</span>
                  )}
                </div>
              </div>
            </div>

            {uploadPreview?.errors && uploadPreview.errors.length > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Issues:</strong>{" "}
                {uploadPreview.errors.slice(0, 2).join(", ")}
                {uploadPreview.errors.length > 2 &&
                  ` (and ${uploadPreview.errors.length - 2} more)`}
              </div>
            )}
          </div>

          {/* Mapping Configuration */}
          {(formData.examId ||
            formData.gradeId ||
            formData.streamId ||
            formData.batchId) && (
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3">📋 Mapping Configuration</h4>
              <div className="text-sm space-y-1">
                {formData.examId && (
                  <div>
                    • Exam: {exams.find((e) => e.id == formData.examId)?.name}
                  </div>
                )}
                {formData.gradeId && (
                  <div>
                    • Grade:{" "}
                    {filteredGrades.find((g) => g.id == formData.gradeId)?.name}
                  </div>
                )}
                {formData.streamId && (
                  <div>
                    • Stream:{" "}
                    {
                      filteredStreams.find((s) => s.id == formData.streamId)
                        ?.name
                    }
                  </div>
                )}
                {formData.batchId && (
                  <div>
                    • Batch:{" "}
                    {
                      filteredBatches.find((b) => b.id == formData.batchId)
                        ?.name
                    }
                  </div>
                )}
                {formData.batchAddOnId && (
                  <div>
                    • Batch Add-on:{" "}
                    {
                      filteredBatchAddOns.find(
                        (a) => a.id == formData.batchAddOnId
                      )?.name
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Data Table View */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-cyan-500 px-4 py-3">
              <h3 className="text-white font-semibold text-lg">
                Uploaded Data View
              </h3>
            </div>

            {/* Chapters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-cyan-400 text-white">
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Error?
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Row No.
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Chapter Code
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Chapter Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Microlectures
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Teacher's Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-cyan-500">
                      Completed
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {uploadPreview?.datas?.map((chapter: any, index: number) => (
                    <>
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 border-r">
                          {chapter.error ? (
                            <X className="w-5 h-5 text-red-500" />
                          ) : (
                            <svg
                              className="w-5 h-5 text-green-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </td>
                        <td className="px-4 py-3 border-r">
                          {chapter.rowNumber}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs border-r">
                          {chapter.chapterCode?.value ||
                            chapter.columns?.chapter_code?.value}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs border-r">
                          {chapter.columns?.chapter_name?.value}
                        </td>
                        <td className="px-4 py-3 border-r">
                          <button
                            onClick={() => toggleChapterExpansion(index)}
                            className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-semibold"
                          >
                            {chapter.microLecture?.length || 0}
                            {chapter.microLecture?.length > 0 &&
                              (expandedChapters.has(index) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              ))}
                          </button>
                        </td>
                        <td className="px-4 py-3 border-r">
                          {chapter.subject?.value ||
                            chapter.columns?.subject?.value}
                        </td>
                        <td className="px-4 py-3 border-r">
                          {chapter.columns?.teacher_name?.value}
                        </td>
                        <td className="px-4 py-3 border-r">
                          {chapter.columns?.title?.value}
                        </td>
                        <td className="px-4 py-3 border-r">
                          <span className="font-semibold">
                            {chapter.columns?.completed?.value || "FALSE"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Micro-lectures Table */}
                      {expandedChapters.has(index) &&
                        chapter.microLecture?.length > 0 && (
                          <tr>
                            <td colSpan={10} className="p-0">
                              <div className=" p-4">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-cyan-400 text-white">
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Error?
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Row No.
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          ML Title
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          ML Code
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Language
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Start Pos
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          End Pos
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Position
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Access Type
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Questions
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Doubts
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold border-r border-cyan-500">
                                          Video Previews
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold">
                                          Factory Ship CQ NQ
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {chapter.microLecture.map(
                                        (ml: any, mlIndex: number) => {
                                          const mlKey = `${index}-${mlIndex}`;
                                          // Get actual counts from the data structure
                                          const questionsCount = ml.microLectureQuesAnswers?.length || 0;
                                          const doubtsCount = ml.microLectureDoubts?.length || 0;
                                          const videoPreviewsCount = ml.videoPreviews?.length || 0;
                                          const factoryshipCQNQsCount = ml.factoryshipCQNQs?.length || 0;

                                          return (
                                            <>
                                              <tr
                                                key={mlIndex}
                                                className="border-b "
                                              >
                                                <td className="px-3 py-2 border-r">
                                                  {ml.error ? (
                                                    <X className="w-4 h-4 text-red-500" />
                                                  ) : (
                                                    <svg
                                                      className="w-4 h-4 text-green-500"
                                                      viewBox="0 0 20 20"
                                                      fill="currentColor"
                                                    >
                                                      <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                      />
                                                    </svg>
                                                  )}
                                                </td>
                                                <td className="px-3 py-2 border-r">
                                                  {ml.rowNumber}
                                                </td>
                                                <td
                                                  className="px-3 py-2 max-w-xs truncate border-r"
                                                  title={
                                                    ml.columns?.micro_lecture_title?.value
                                                  }
                                                >
                                                  {ml.columns?.micro_lecture_title?.value}
                                                </td>
                                                <td className="px-3 py-2 font-mono border-r">
                                                  {
                                                    ml.columns
                                                      ?.micro_lecture_code
                                                      ?.value
                                                  }
                                                </td>
                                                <td className="px-3 py-2 border-r">
                                                  {ml.language?.value || "HINDI"}
                                                </td>
                                                <td className="px-3 py-2 border-r">
                                                  {ml.columns?.video_start_position?.value}
                                                </td>
                                                <td className="px-3 py-2 border-r">
                                                  {ml.columns?.video_end_position?.value}
                                                </td>
                                                <td className="px-3 py-2 border-r">
                                                  {ml.columns?.position?.value}
                                                </td>
                                                <td className="px-3 py-2 border-r">
                                                  {ml.columns?.subscription_type
                                                    ?.value || "BASIC"}
                                                </td>
                                                {/* Questions */}
                                                <td className="px-3 py-2 border-r">
                                                  {questionsCount > 0 ? (
                                                    <button
                                                      onClick={() => {
                                                        setSelectedDetailView({
                                                          type: 'questions',
                                                          data: ml.microLectureQuesAnswers,
                                                          title: `Questions for ${ml.columns?.micro_lecture_code?.value}`,
                                                          microLectureCode: ml.columns?.micro_lecture_code?.value
                                                        });
                                                        setCurrentPage(1);
                                                      }}
                                                      className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-semibold  px-2 py-1 rounded"
                                                    >
                                                      {questionsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </button>
                                                  ) : (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                      {questionsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </div>
                                                  )}
                                                </td>
                                                {/* Doubts */}
                                                <td className="px-3 py-2 border-r">
                                                  {doubtsCount > 0 ? (
                                                    <button
                                                      onClick={() => {
                                                        setSelectedDetailView({
                                                          type: 'doubts',
                                                          data: ml.microLectureDoubts,
                                                          title: `Doubts for ${ml.columns?.micro_lecture_code?.value}`,
                                                          microLectureCode: ml.columns?.micro_lecture_code?.value
                                                        });
                                                        setCurrentPage(1);
                                                      }}
                                                      className="flex items-center gap-1 text-green-600 hover:text-green-700 font-semibold hover:bg-green-50 px-2 py-1 rounded"
                                                    >
                                                      {doubtsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </button>
                                                  ) : (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                      {doubtsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </div>
                                                  )}
                                                </td>
                                                {/* Video Previews */}
                                                <td className="px-3 py-2 border-r">
                                                  {videoPreviewsCount > 0 ? (
                                                    <button
                                                      onClick={() => {
                                                        setSelectedDetailView({
                                                          type: 'videoPreviews',
                                                          data: ml.videoPreviews,
                                                          title: `Video Previews for ${ml.columns?.micro_lecture_code?.value}`,
                                                          microLectureCode: ml.columns?.micro_lecture_code?.value
                                                        });
                                                        setCurrentPage(1);
                                                      }}
                                                      className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold hover:bg-purple-50 px-2 py-1 rounded"
                                                    >
                                                      {videoPreviewsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </button>
                                                  ) : (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                      {videoPreviewsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </div>
                                                  )}
                                                </td>
                                                {/* Factory Ship CQ/NQ */}
                                                <td className="px-3 py-2">
                                                  {factoryshipCQNQsCount > 0 ? (
                                                    <button
                                                      onClick={() => {
                                                        setSelectedDetailView({
                                                          type: 'factoryshipCQNQs',
                                                          data: ml.factoryshipCQNQs,
                                                          title: `Factory Ship CQ/NQ for ${ml.columns?.micro_lecture_code?.value}`,
                                                          microLectureCode: ml.columns?.micro_lecture_code?.value
                                                        });
                                                        setCurrentPage(1);
                                                      }}
                                                      className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-semibold hover:bg-cyan-50 px-2 py-1 rounded"
                                                    >
                                                      {factoryshipCQNQsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </button>
                                                  ) : (
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                      {factoryshipCQNQsCount}
                                                      <Eye className="w-4 h-4" />
                                                    </div>
                                                  )}
                                                </td>
                                              </tr>

                                              {/* Expanded Questions Table */}
                                              {expandedMicroLectures.has(
                                                mlKey
                                              ) &&
                                                questionsCount > 0 && (
                                                  <tr>
                                                    <td
                                                      colSpan={13}
                                                      className="p-0"
                                                    >
                                                      <div className=" p-3">
                                                        <div className="overflow-x-auto">
                                                          <table className="w-full text-xs border-collapse">
                                                            <thead>
                                                              <tr className="bg-cyan-400 text-white">
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  Error?
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  Row No.
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  Question
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  Start Pos
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  End Pos
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  Correct Seek
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  Wrong Seek
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold border-r border-cyan-500">
                                                                  Incorrect Seek
                                                                  Start
                                                                </th>
                                                                <th className="px-2 py-2 text-left font-semibold">
                                                                  Incorrect Seek
                                                                  End
                                                                </th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {ml.questions?.map(
                                                                (
                                                                  q: any,
                                                                  qIndex: number
                                                                ) => (
                                                                  <tr
                                                                    key={qIndex}
                                                                    className="border-b hover:bg-cyan-200"
                                                                  >
                                                                    <td className="px-2 py-2 border-r">
                                                                      {q.error ? (
                                                                        <X className="w-4 h-4 text-red-500" />
                                                                      ) : (
                                                                        <svg
                                                                          className="w-4 h-4 text-green-500"
                                                                          viewBox="0 0 20 20"
                                                                          fill="currentColor"
                                                                        >
                                                                          <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                          />
                                                                        </svg>
                                                                      )}
                                                                    </td>
                                                                    <td className="px-2 py-2 border-r">
                                                                      {
                                                                        q.rowNumber
                                                                      }
                                                                    </td>
                                                                    <td
                                                                      className="px-2 py-2 max-w-sm truncate border-r"
                                                                      title={
                                                                        q
                                                                          .columns
                                                                          ?.question
                                                                          ?.value
                                                                      }
                                                                    >
                                                                      {q.columns
                                                                        ?.question
                                                                        ?.value ||
                                                                        "N/A"}
                                                                    </td>
                                                                    <td className="px-2 py-2 border-r">
                                                                      {
                                                                        q
                                                                          .columns
                                                                          ?.start_pos
                                                                          ?.value
                                                                      }
                                                                    </td>
                                                                    <td className="px-2 py-2 border-r">
                                                                      {
                                                                        q
                                                                          .columns
                                                                          ?.end_pos
                                                                          ?.value
                                                                      }
                                                                    </td>
                                                                    <td className="px-2 py-2 border-r">
                                                                      {
                                                                        q
                                                                          .columns
                                                                          ?.correct_seek
                                                                          ?.value
                                                                      }
                                                                    </td>
                                                                    <td className="px-2 py-2 border-r">
                                                                      {
                                                                        q
                                                                          .columns
                                                                          ?.wrong_seek
                                                                          ?.value
                                                                      }
                                                                    </td>
                                                                    <td className="px-2 py-2 border-r">
                                                                      {
                                                                        q
                                                                          .columns
                                                                          ?.incorrect_seek_start
                                                                          ?.value
                                                                      }
                                                                    </td>
                                                                    <td className="px-2 py-2">
                                                                      {
                                                                        q
                                                                          .columns
                                                                          ?.incorrect_seek_end
                                                                          ?.value
                                                                      }
                                                                    </td>
                                                                  </tr>
                                                                )
                                                              )}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                            </>
                                          );
                                        }
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed View Table */}
          {selectedDetailView && (
            <div className="mt-6 border rounded-lg">
              <div className="border-b p-4 flex justify-between items-center bg-gradient-to-r from-cyan-500 to-cyan-600">
                <h3 className="font-semibold text-white text-lg">
                  {selectedDetailView.title}
                </h3>
                <button
                  onClick={() => {
                    setSelectedDetailView(null);
                    setCurrentPage(1);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-auto">
                {selectedDetailView.type === 'questions' && (() => {
                  console.log('Questions data:', selectedDetailView.data);
                  const totalPages = Math.ceil(selectedDetailView.data.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentData = selectedDetailView.data.slice(startIndex, endIndex);
                  
                  return (
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border">
                          <thead>
                            <tr >
                              <th className="px-3 py-2 text-left font-semibold border">Row</th>
                              <th className="px-3 py-2 text-left font-semibold border">Question</th>
                              <th className="px-3 py-2 text-left font-semibold border">Start Position</th>
                              <th className="px-3 py-2 text-left font-semibold border">End Position</th>
                              <th className="px-3 py-2 text-left font-semibold border">Correct Seek</th>
                              <th className="px-3 py-2 text-left font-semibold border">Wrong Seek</th>
                              <th className="px-3 py-2 text-left font-semibold border">Position</th>
                              <th className="px-3 py-2 text-left font-semibold border">Correct Answer</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentData.map((item: any, index: number) => (
                              <tr key={startIndex + index} >
                                <td className="px-3 py-2 border">{item.rowNumber || startIndex + index + 1}</td>
                                <td className="px-3 py-2 border max-w-xs">{item.columns?.question?.value || 'N/A'}</td>
                                <td className="px-3 py-2 border">{item.columns?.start_position?.value || 'N/A'}</td>
                                <td className="px-3 py-2 border">{item.columns?.end_position?.value || 'N/A'}</td>
                                <td className="px-3 py-2 border">{item.columns?.correct_answer_seek_to?.value || 'N/A'}</td>
                                <td className="px-3 py-2 border">{item.columns?.wrong_answer_seek_to?.value || 'N/A'}</td>
                                <td className="px-3 py-2 border">{item.columns?.pos?.value || 'N/A'}</td>
                                <td className="px-3 py-2 border max-w-sm">{item.columns?.correct_answer_intent_text?.value || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 px-2">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(endIndex, selectedDetailView.data.length)} of {selectedDetailView.data.length} questions
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              &lt;
                            </button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedDetailView.type === 'doubts' && (() => {
                  console.log('Doubts data:', selectedDetailView.data);
                  const totalPages = Math.ceil(selectedDetailView.data.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentData = selectedDetailView.data.slice(startIndex, endIndex);
                  
                  return (
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border">
                          <thead>
                            <tr >
                              <th className="px-3 py-2 text-left font-semibold border">Row</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 1</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 2</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 3</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 4</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentData.map((item: any, index: number) => {
                              console.log('Doubt item:', item);
                              // Get available keys from columns
                              const columns = item.columns || {};
                              const keys = Object.keys(columns).slice(0, 4); // Show first 4 columns
                              
                              return (
                                <tr key={startIndex + index} className="hover:bg-green-50">
                                  <td className="px-3 py-2 border">{item.rowNumber || startIndex + index + 1}</td>
                                  {keys.map((key, keyIndex) => (
                                    <td key={keyIndex} className="px-3 py-2 border max-w-xs">
                                      {columns[key]?.value || 'N/A'}
                                    </td>
                                  ))}
                                  {/* Fill remaining columns if less than 4 keys */}
                                  {Array.from({length: 4 - keys.length}).map((_, emptyIndex) => (
                                    <td key={`empty-${emptyIndex}`} className="px-3 py-2 border">N/A</td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 px-2">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(endIndex, selectedDetailView.data.length)} of {selectedDetailView.data.length} doubts
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              &lt;
                            </button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedDetailView.type === 'videoPreviews' && (() => {
                  console.log('Video preview data:', selectedDetailView.data);
                  const totalPages = Math.ceil(selectedDetailView.data.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentData = selectedDetailView.data.slice(startIndex, endIndex);
                  
                  return (
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border">
                          <thead>
                            <tr >
                              <th className="px-3 py-2 text-left font-semibold border">Row</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 1</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 2</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 3</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 4</th>
                              <th className="px-3 py-2 text-left font-semibold border">Field 5</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentData.map((item: any, index: number) => {
                              console.log('Video preview item:', item);
                              // Get available keys from columns
                              const columns = item.columns || {};
                              const keys = Object.keys(columns).slice(0, 5); // Show first 5 columns
                              
                              return (
                                <tr key={startIndex + index} className="hover:bg-purple-50">
                                  <td className="px-3 py-2 border">{item.rowNumber || startIndex + index + 1}</td>
                                  {keys.map((key, keyIndex) => (
                                    <td key={keyIndex} className="px-3 py-2 border max-w-xs">
                                      {columns[key]?.value || 'N/A'}
                                    </td>
                                  ))}
                                  {/* Fill remaining columns if less than 5 keys */}
                                  {Array.from({length: 5 - keys.length}).map((_, emptyIndex) => (
                                    <td key={`empty-${emptyIndex}`} className="px-3 py-2 border">N/A</td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 px-2">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(endIndex, selectedDetailView.data.length)} of {selectedDetailView.data.length} video previews
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              &lt;
                            </button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedDetailView.type === 'factoryshipCQNQs' && (() => {
                  console.log('Factory ship data:', selectedDetailView.data);
                  const totalPages = Math.ceil(selectedDetailView.data.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentData = selectedDetailView.data.slice(startIndex, endIndex);
                  
                  return (
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border">
                          <thead>
                            <tr className="">
                              <th className="px-3 py-2 text-left font-semibold border">Row</th>
                              <th className="px-3 py-2 text-left font-semibold border">Question</th>
                              <th className="px-3 py-2 text-left font-semibold border">Type</th>
                              <th className="px-3 py-2 text-left font-semibold border">Option A</th>
                              <th className="px-3 py-2 text-left font-semibold border">Option B</th>
                              <th className="px-3 py-2 text-left font-semibold border">Answer</th>
                              <th className="px-3 py-2 text-left font-semibold border">Marks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentData.map((item: any, index: number) => {
                              console.log('Factory ship item:', item);
                              const columns = item.columns || {};
                              
                              return (
                                <tr key={startIndex + index} className="hover:bg-zinc-700">
                                  <td className="px-3 py-2 border">{item.rowNumber || startIndex + index + 1}</td>
                                  <td className="px-3 py-2 border max-w-xs truncate" title={columns.question?.value}>
                                    {columns.question?.value || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 border">
                                    {columns.question_type?.value || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 border max-w-xs truncate" title={columns.optiona?.value}>
                                    {columns.optiona?.value || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 border max-w-xs truncate" title={columns.optionb?.value}>
                                    {columns.optionb?.value || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 border">
                                    {columns.answer?.value || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 border">
                                    {columns.marks?.value || 'N/A'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 px-2">
                          <div className="text-sm text-gray-600">
                            Showing {startIndex + 1}-{Math.min(endIndex, selectedDetailView.data.length)} of {selectedDetailView.data.length} factory ship items
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
                            >
                              &lt;
                            </button>
                            <span className="text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
                            >
                              &gt;
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* View Full Details Toggle */}
          <div className="border rounded-lg">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-muted/50"
            >
              <span className="font-medium text-sm">
                View Full JSON Response
              </span>
              <span className="text-xs text-muted-foreground">
                {showFullDetails ? " Hide" : " Preview"}
              </span>
            </button>

            {showFullDetails && (
              <div className="border-t p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs p-3 rounded border whitespace-pre-wrap break-words font-mono bg-muted/50">
                  {JSON.stringify(uploadPreview, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
