import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info, Download } from "lucide-react";
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

  useEffect(() => {
    if (open) {
      loadInitialData();
      resetDialog();
    }
  }, [open]);

  const loadInitialData = async () => {
    // Load exams
    setExamsLoading(true);
    try {
      const response = await fetchExamsPaginated({ pageNo: 0, pageSize: 50, active: true });
      setExams(response.content || []);
    } catch (error) {
      console.error("Failed to load exams:", error);
    } finally {
      setExamsLoading(false);
    }

    // Load grades
    setGradesLoading(true);
    try {
      const response = await fetchGradesPaginated({ pageNo: 0, pageSize: 50, active: true });
      setGrades(response.content || []);
    } catch (error) {
      console.error("Failed to load grades:", error);
    } finally {
      setGradesLoading(false);
    }

    // Load streams
    setStreamsLoading(true);
    try {
      const response = await fetchStreamsPaginated({ pageNo: 0, pageSize: 50, active: true });
      setStreams(response.content || []);
    } catch (error) {
      console.error("Failed to load streams:", error);
    } finally {
      setStreamsLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("select");
    setSelectedFile(null);
    setSelectedExam(null);
    setSelectedGrade(null);
    setSelectedStream(null);
    setLanguage("ENGLISH");
    setUploadResponse(null);
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
                  <div className="grid gap-2">
                    <Label>Exam</Label>
                    <Select
                      value={selectedExam?.id?.toString() || "none"}
                      onValueChange={(v) => setSelectedExam(v === "none" ? null : exams.find((e) => e.id === parseInt(v)) || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Exam (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Exam</SelectItem>
                        {exams.map((exam) => (
                          <SelectItem key={exam.id} value={exam.id.toString()}>
                            {exam.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Grade</Label>
                    <Select
                      value={selectedGrade?.id?.toString() || "none"}
                      onValueChange={(v) => setSelectedGrade(v === "none" ? null : grades.find((g) => g.id === parseInt(v)) || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Grade (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Grade</SelectItem>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id.toString()}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Stream</Label>
                    <Select
                      value={selectedStream?.id?.toString() || "none"}
                      onValueChange={(v) => setSelectedStream(v === "none" ? null : streams.find((s) => s.id === parseInt(v)) || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Stream (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Stream</SelectItem>
                        {streams.map((stream) => (
                          <SelectItem key={stream.id} value={stream.id.toString()}>
                            {stream.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
