import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, ChevronDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { createNote, fetchBatchesPaginated } from "@/services/notes";
import type { BatchOption, NotesCreateRequest } from "@/types/notes";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NOTE_TYPES = [
  { value: "TOPPER_NOTES", label: "Topper Notes" },
  { value: "PREVIOUS_YEAR_PAPER", label: "Previous Year Paper" },
  { value: "NCERT_SOLUTION", label: "NCERT Solution" },
  { value: "IMPORTANT_NOTES", label: "Important notes" },
  
];

const ACCESS_TYPES = [
  { value: "FREE", label: "Free" },
  { value: "BASIC", label: "Basic" },
  { value: "PREMIUM", label: "Premium" },
];

export function CreateNoteDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateNoteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [notesBy, setNotesBy] = useState("");
  const [url, setUrl] = useState("");
  const [accessType, setAccessType] = useState<"BASIC" | "PREMIUM" | "FREE">("BASIC");
  const [type, setType] = useState("TOPPER_NOTES");
  const [displayOrder, setDisplayOrder] = useState(1);

  // Batch selection state
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedBatchName, setSelectedBatchName] = useState("");
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [batchPagination, setBatchPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load batch options when dialog opens
  useEffect(() => {
    if (open) {
      loadBatchOptions(0, "");
      resetForm();
    }
  }, [open]);

  const loadBatchOptions = async (pageNo: number = 0, search: string = "") => {
    setLoading(true);
    try {
      const response = await fetchBatchesPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        activeFlag: true,
      });

      setBatches(response.content as BatchOption[]);
      setBatchPagination({
        currentPage: response.pageNumber,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        pageSize: response.pageSize,
      });
    } catch (error) {
      console.error("[CreateNoteDialog] Failed to load batch options:", error);
      toast.error("Failed to load batch options");
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
    setSelectedBatchId(batch.id);
    setSelectedBatchName(batch.name);
    setBatchDropdownOpen(false);
  };

  const resetForm = () => {
    setCode("");
    setSubject("");
    setTitle("");
    setNotesBy("");
    setUrl("");
    setAccessType("BASIC");
    setType("TOPPER_NOTES");
    setDisplayOrder(1);
    setSelectedBatchId(null);
    setSelectedBatchName("");
    setBatchSearchQuery("");
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const validateForm = (): boolean => {
    if (!selectedBatchId) {
      toast.error("Please select a batch");
      return false;
    }
    if (!code.trim()) {
      toast.error("Please enter a note code");
      return false;
    }
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return false;
    }
    if (!title.trim()) {
      toast.error("Please enter a title");
      return false;
    }
    if (!notesBy.trim()) {
      toast.error("Please enter notes author");
      return false;
    }
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return false;
    }
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: NotesCreateRequest = {
        code: code.trim(),
        subject: subject.trim(),
        title: title.trim(),
        notesBy: notesBy.trim(),
        url: url.trim(),
        accessType,
        type,
        displayOrder,
      };

      const response = await createNote(selectedBatchId!, payload);

      if (response.success) {
        toast.success(response.message || "Note created successfully");
        onSuccess();
        handleClose();
      } else {
        toast.error(response.message || "Failed to create note");
      }
    } catch (error) {
      console.error("[CreateNoteDialog] Error creating note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Note
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-6">
          {/* Batch Selection */}
          <div className="space-y-2">
            <Label>
              Select Batch <span className="text-destructive">*</span>
            </Label>
            <Popover open={batchDropdownOpen} onOpenChange={setBatchDropdownOpen}>
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
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search batches..."
                    value={batchSearchQuery}
                    onChange={(e) => handleBatchSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
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
                    batches.map((batch) => (
                      <div
                        key={batch.id}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                        onClick={() => handleBatchSelect(batch)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 shrink-0 ${
                            selectedBatchId === batch.id ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{batch.name}</span>
                          {batch.code && (
                            <span className="text-xs text-muted-foreground truncate">
                              {batch.code}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
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
                      Page {batchPagination.currentPage + 1} of {batchPagination.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextBatchPage}
                      disabled={loading || batchPagination.currentPage >= batchPagination.totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Note Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g., Note-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Subject <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g., Physics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Notes By <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g., Champions Academy"
                value={notesBy}
                onChange={(e) => setNotesBy(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Access Type</Label>
                <Select
                  value={accessType}
                  onValueChange={(v) => setAccessType(v as "BASIC" | "PREMIUM" | "FREE")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Note
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
