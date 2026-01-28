import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Info,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import {
  bulkUploadReels,
  bulkSaveReels,
  fetchExamsPaginated,
  fetchGradesPaginated,
  fetchStreamsPaginated,
} from "@/services/reels";
import type {
  ReelBulkUploadResponse,
  ExamOption,
  GradeOption,
  StreamOption,
} from "@/types/reels";

interface BulkUploadReelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkUploadReelsDialog({ open, onOpenChange, onSuccess }: BulkUploadReelsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Step state: 'select' | 'preview' | 'result'
  const [step, setStep] = useState<"select" | "preview" | "result">("select");

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Upload params
  const [selectedExam, setSelectedExam] = useState<ExamOption | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<GradeOption | null>(null);
  const [selectedStream, setSelectedStream] = useState<StreamOption | null>(null);
  const [language, setLanguage] = useState<"ENGLISH" | "HINDI">("ENGLISH");

  // Preview data
  const [uploadResponse, setUploadResponse] = useState<ReelBulkUploadResponse | null>(null);

  // Dropdown data
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);

  // Loading states
  const [examsLoading, setExamsLoading] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [streamsLoading, setStreamsLoading] = useState(false);

  // Dropdown open states
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [streamDropdownOpen, setStreamDropdownOpen] = useState(false);

  // Search query states
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [gradeSearchQuery, setGradeSearchQuery] = useState("");
  const [streamSearchQuery, setStreamSearchQuery] = useState("");

  // Pagination states
  const [examPagination, setExamPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [gradePagination, setGradePagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [streamPagination, setStreamPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  // Search timeout refs
  const examSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gradeSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      loadExams(0, "");
      loadGrades(0, "");
      loadStreams(0, "");
      resetDialog();
    }
  }, [open]);

  // Exam pagination handlers
  const loadExams = async (pageNo: number = 0, search: string = "") => {
    setExamsLoading(true);
    try {
      const response = await fetchExamsPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        active: true,
      });
      setExams(response.content || []);
      setExamPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("Failed to load exams:", error);
      setExams([]);
    } finally {
      setExamsLoading(false);
    }
  };

  const handleExamSearch = (query: string) => {
    setExamSearchQuery(query);
    if (examSearchTimeoutRef.current) {
      clearTimeout(examSearchTimeoutRef.current);
    }
    examSearchTimeoutRef.current = setTimeout(() => {
      loadExams(0, query);
    }, 300);
  };

  const handlePrevExamPage = () => {
    if (examPagination.currentPage > 0) {
      loadExams(examPagination.currentPage - 1, examSearchQuery);
    }
  };

  const handleNextExamPage = () => {
    if (examPagination.currentPage < examPagination.totalPages - 1) {
      loadExams(examPagination.currentPage + 1, examSearchQuery);
    }
  };

  const handleExamSelect = (exam: ExamOption | null) => {
    setSelectedExam(exam);
    setExamDropdownOpen(false);
  };

  // Grade pagination handlers
  const loadGrades = async (pageNo: number = 0, search: string = "") => {
    setGradesLoading(true);
    try {
      const response = await fetchGradesPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        active: true,
      });
      setGrades(response.content || []);
      setGradePagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("Failed to load grades:", error);
      setGrades([]);
    } finally {
      setGradesLoading(false);
    }
  };

  const handleGradeSearch = (query: string) => {
    setGradeSearchQuery(query);
    if (gradeSearchTimeoutRef.current) {
      clearTimeout(gradeSearchTimeoutRef.current);
    }
    gradeSearchTimeoutRef.current = setTimeout(() => {
      loadGrades(0, query);
    }, 300);
  };

  const handlePrevGradePage = () => {
    if (gradePagination.currentPage > 0) {
      loadGrades(gradePagination.currentPage - 1, gradeSearchQuery);
    }
  };

  const handleNextGradePage = () => {
    if (gradePagination.currentPage < gradePagination.totalPages - 1) {
      loadGrades(gradePagination.currentPage + 1, gradeSearchQuery);
    }
  };

  const handleGradeSelect = (grade: GradeOption | null) => {
    setSelectedGrade(grade);
    setGradeDropdownOpen(false);
  };

  // Stream pagination handlers
  const loadStreams = async (pageNo: number = 0, search: string = "") => {
    setStreamsLoading(true);
    try {
      const response = await fetchStreamsPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        active: true,
      });
      setStreams(response.content || []);
      setStreamPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("Failed to load streams:", error);
      setStreams([]);
    } finally {
      setStreamsLoading(false);
    }
  };

  const handleStreamSearch = (query: string) => {
    setStreamSearchQuery(query);
    if (streamSearchTimeoutRef.current) {
      clearTimeout(streamSearchTimeoutRef.current);
    }
    streamSearchTimeoutRef.current = setTimeout(() => {
      loadStreams(0, query);
    }, 300);
  };

  const handlePrevStreamPage = () => {
    if (streamPagination.currentPage > 0) {
      loadStreams(streamPagination.currentPage - 1, streamSearchQuery);
    }
  };

  const handleNextStreamPage = () => {
    if (streamPagination.currentPage < streamPagination.totalPages - 1) {
      loadStreams(streamPagination.currentPage + 1, streamSearchQuery);
    }
  };

  const handleStreamSelect = (stream: StreamOption | null) => {
    setSelectedStream(stream);
    setStreamDropdownOpen(false);
  };

  const resetDialog = () => {
    setStep("select");
    setSelectedFile(null);
    setSelectedExam(null);
    setSelectedGrade(null);
    setSelectedStream(null);
    setLanguage("ENGLISH");
    setUploadResponse(null);
    setExamSearchQuery("");
    setGradeSearchQuery("");
    setStreamSearchQuery("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
        toast.error("Please select an Excel file (.xlsx, .xls) or CSV file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const response = await bulkUploadReels(selectedFile, {
        examId: selectedExam?.id,
        gradeId: selectedGrade?.id,
        streamId: selectedStream?.id,
        language,
      });

      setUploadResponse(response);
      setStep("preview");

      if (response.hasErrors) {
        toast.warning(`File uploaded with ${response.errorCount} errors`);
      } else {
        toast.success("File uploaded successfully!");
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast.error("Failed to upload file: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!uploadResponse) return;

    setIsSaving(true);
    try {
      const result = await bulkSaveReels(uploadResponse);

      if (result.failureCount > 0) {
        toast.warning(`${result.successCount} reels saved, ${result.failureCount} failed`);
      } else {
        toast.success(`${result.successCount} reels saved successfully!`);
      }

      setStep("result");
      onSuccess();
    } catch (error) {
      console.error("Failed to save reels:", error);
      toast.error("Failed to save reels: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-2 sm:max-w-xl md:max-w-3xl flex flex-col h-full">
        <SheetHeader className="shrink-0 space-y-1">
          <SheetTitle className="text-xl">Bulk Upload Reels</SheetTitle>
          <SheetDescription>
            Upload an Excel file to create multiple reels at once.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
          {step === "select" && (
            <div className="grid gap-6 py-6">
              {/* Instructions */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">How to bulk upload reels:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700">
                    <li>Download the template Excel file</li>
                    <li>Fill in the reel details (title, video URL, etc.)</li>
                    <li>Select the file below and click "Upload & Preview"</li>
                    <li>Review the preview and fix any errors</li>
                    <li>Click "Save" to create all valid reels</li>
                  </ol>
                </div>
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="font-medium">Excel Template</p>
                  <p className="text-sm text-muted-foreground">Download the template to get started</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <Separator />

              {/* File Input */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Select File
                </h3>

                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="h-10 w-10 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-lg">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-lg font-medium">Click to select Excel file</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supported formats: .xlsx, .xls, .csv
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Optional Targeting */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Optional Targeting
                </h3>
                <p className="text-sm text-muted-foreground">
                  These settings will apply to all reels in the file (can be overridden per row in Excel)
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* Exam Dropdown with Pagination */}
                  <div className="grid gap-2">
                    <Label>Exam</Label>
                    <Popover open={examDropdownOpen} onOpenChange={setExamDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          <span className="truncate">
                            {selectedExam?.name || "Select Exam (optional)"}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0" align="start">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search exams..."
                            value={examSearchQuery}
                            onChange={(e) => handleExamSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {/* No Exam option */}
                          <div
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            onClick={() => handleExamSelect(null)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 shrink-0 ${
                                !selectedExam ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <span>No Exam</span>
                          </div>
                          {examsLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm">Loading...</span>
                            </div>
                          ) : exams.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              No exams found.
                            </div>
                          ) : (
                            exams.map((exam) => (
                              <div
                                key={exam.id}
                                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                                onClick={() => handleExamSelect(exam)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    selectedExam?.id === exam.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium truncate">{exam.name}</span>
                                  {exam.code && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {exam.code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {examPagination.totalPages > 1 && (
                          <div className="flex items-center justify-between p-2 border-t bg-background">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handlePrevExamPage}
                              disabled={examsLoading || examPagination.currentPage === 0}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Prev
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Page {examPagination.currentPage + 1} of {examPagination.totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleNextExamPage}
                              disabled={examsLoading || examPagination.currentPage >= examPagination.totalPages - 1}
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Grade Dropdown with Pagination */}
                  <div className="grid gap-2">
                    <Label>Grade</Label>
                    <Popover open={gradeDropdownOpen} onOpenChange={setGradeDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          <span className="truncate">
                            {selectedGrade?.name || "Select Grade (optional)"}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0" align="start">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search grades..."
                            value={gradeSearchQuery}
                            onChange={(e) => handleGradeSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {/* No Grade option */}
                          <div
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            onClick={() => handleGradeSelect(null)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 shrink-0 ${
                                !selectedGrade ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <span>No Grade</span>
                          </div>
                          {gradesLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm">Loading...</span>
                            </div>
                          ) : grades.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              No grades found.
                            </div>
                          ) : (
                            grades.map((grade) => (
                              <div
                                key={grade.id}
                                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                                onClick={() => handleGradeSelect(grade)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    selectedGrade?.id === grade.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium truncate">{grade.name}</span>
                                  {grade.code && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {grade.code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {gradePagination.totalPages > 1 && (
                          <div className="flex items-center justify-between p-2 border-t bg-background">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handlePrevGradePage}
                              disabled={gradesLoading || gradePagination.currentPage === 0}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Prev
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Page {gradePagination.currentPage + 1} of {gradePagination.totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleNextGradePage}
                              disabled={gradesLoading || gradePagination.currentPage >= gradePagination.totalPages - 1}
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Stream Dropdown with Pagination */}
                  <div className="grid gap-2">
                    <Label>Stream</Label>
                    <Popover open={streamDropdownOpen} onOpenChange={setStreamDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          <span className="truncate">
                            {selectedStream?.name || "Select Stream (optional)"}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0" align="start">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Search streams..."
                            value={streamSearchQuery}
                            onChange={(e) => handleStreamSearch(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {/* No Stream option */}
                          <div
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            onClick={() => handleStreamSelect(null)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 shrink-0 ${
                                !selectedStream ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <span>No Stream</span>
                          </div>
                          {streamsLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm">Loading...</span>
                            </div>
                          ) : streams.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                              No streams found.
                            </div>
                          ) : (
                            streams.map((stream) => (
                              <div
                                key={stream.id}
                                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                                onClick={() => handleStreamSelect(stream)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    selectedStream?.id === stream.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="font-medium truncate">{stream.name}</span>
                                  {stream.code && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {stream.code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {streamPagination.totalPages > 1 && (
                          <div className="flex items-center justify-between p-2 border-t bg-background">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handlePrevStreamPage}
                              disabled={streamsLoading || streamPagination.currentPage === 0}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Prev
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Page {streamPagination.currentPage + 1} of {streamPagination.totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleNextStreamPage}
                              disabled={streamsLoading || streamPagination.currentPage >= streamPagination.totalPages - 1}
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid gap-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENGLISH">English</SelectItem>
                        <SelectItem value="HINDI">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "preview" && uploadResponse && (
            <div className="grid gap-6 py-6">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-muted/30 text-center">
                  <p className="text-3xl font-bold">{uploadResponse.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div className="p-4 rounded-lg border bg-green-50 text-center">
                  <p className="text-3xl font-bold text-green-600">{uploadResponse.validCount}</p>
                  <p className="text-sm text-muted-foreground">Valid</p>
                </div>
                <div className="p-4 rounded-lg border bg-red-50 text-center">
                  <p className="text-3xl font-bold text-red-600">{uploadResponse.errorCount}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-sm font-medium">
                    {selectedExam?.name || "Any"} / {selectedGrade?.name || "Any"} / {selectedStream?.name || "Any"}
                  </p>
                  <p className="text-sm text-muted-foreground">Targeting</p>
                </div>
              </div>

              {/* Global Errors */}
              {uploadResponse.errors && uploadResponse.errors.length > 0 && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 text-red-600 font-medium mb-2">
                    <AlertCircle className="h-5 w-5" />
                    Global Errors
                  </div>
                  <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                    {uploadResponse.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Separator />

              {/* Preview Table */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Preview Data
                </h3>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Row</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Video URL</TableHead>
                        <TableHead className="w-[80px]">Duration</TableHead>
                        <TableHead className="w-[100px]">Difficulty</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResponse.reels?.map((reel, index) => (
                        <TableRow key={index} className={reel.hasError ? "bg-red-50" : ""}>
                          <TableCell className="font-medium">{reel.rowNumber}</TableCell>
                          <TableCell className="max-w-[180px] truncate" title={reel.title}>
                            {reel.title}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate" title={reel.videoUrl}>
                            {reel.videoUrl}
                          </TableCell>
                          <TableCell>{reel.durationSeconds}s</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {reel.difficultyLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reel.hasError ? (
                              <div className="flex items-center gap-1.5 text-red-600">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span className="text-xs truncate" title={reel.errorMessage}>
                                  {reel.errorMessage?.substring(0, 15)}...
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-green-600">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                <span className="text-xs">Valid</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {step === "result" && (
            <div className="py-12 text-center">
              <CheckCircle2 className="h-20 w-20 mx-auto text-green-600 mb-6" />
              <h3 className="text-2xl font-semibold mb-2">Upload Complete!</h3>
              <p className="text-muted-foreground text-lg">
                Your reels have been saved successfully.
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="shrink-0 border-t pt-4">
          {step === "select" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload & Preview
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !uploadResponse?.validCount}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save {uploadResponse?.validCount} Valid Reels
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
