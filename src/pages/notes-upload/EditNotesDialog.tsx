import { useState, useEffect, useRef } from "react";
import { Loader2, Save, ChevronDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { updateNote, fetchSubjectsPaginated, type SubjectOption } from "@/services/notes";
import type { NotesResponseDto } from "@/types/notes";

interface EditNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: NotesResponseDto | null;
  onSuccess: () => void;
}
// ,PREVIOUS_YEAR_PAPER,,
const NOTES_TYPES = {
  PREVIOUS_YEAR_PAPER: "Previous Year Paper",
  TOPPER_NOTES: "Topper Notes",
  NCERT_SOLUTION: "NCERT Solution",
  IMPORTANT_NOTES: "Important Notes",
};

const ACCESS_TYPES = {
  BASIC: "Basic",
  PREMIUM: "Premium",
};

interface FormData {
  code: string;
  title: string;
  url: string;
  accessType: string;
  type: string;
  position: number;
  isActive: boolean;
  subject: string;
  notesBy: string;
}

export function EditNotesDialog({
  open,
  onOpenChange,
  note,
  onSuccess,
}: EditNotesDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [subjectPagination, setSubjectPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<FormData>({
    code: "",
    title: "",
    url: "",
    accessType: "BASIC",
    type: "NOTES",
    position: 0,
    isActive: true,
    subject: "",
    notesBy: "",
  });

  // Fetch subjects when dialog opens
  useEffect(() => {
    if (open) {
      loadSubjects(0, "");
    }
  }, [open]);

  const loadSubjects = async (pageNo: number = 0, search: string = "") => {
    setSubjectsLoading(true);
    try {
      const response = await fetchSubjectsPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
      });

      // Replace subjects for page-based navigation
      setSubjects(response.content);

      setSubjectPagination({
        currentPage: response.pageNumber,
        totalPages: response.totalPages,
        totalElements: response.totalElements,
        pageSize: response.pageSize,
      });
    } catch (error) {
      console.error("Failed to load subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleSubjectSearch = (query: string) => {
    setSubjectSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadSubjects(0, query);
    }, 300);
  };

  const handlePrevSubjectPage = () => {
    if (subjectPagination.currentPage > 0) {
      loadSubjects(subjectPagination.currentPage - 1, subjectSearchQuery);
    }
  };

  const handleNextSubjectPage = () => {
    if (subjectPagination.currentPage < subjectPagination.totalPages - 1) {
      loadSubjects(subjectPagination.currentPage + 1, subjectSearchQuery);
    }
  };

  const handleSubjectSelect = (subject: SubjectOption) => {
    setFormData((prev) => ({ ...prev, subject: subject.displayName }));
    setSubjectDropdownOpen(false);
  };

  // Populate form when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        code: note.notesCode || "",
        title: note.title || "",
        url: note.notesUrl || "",
        accessType: note.accessType || "BASIC",
        type: note.notesType || "NOTES",
        position: note.position || 0,
        isActive: note.isActive ?? true,
        subject: note.subjectName || "",
        notesBy: note.notesBy || "",
      });
    }
  }, [note]);

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error("Please enter a code");
      return false;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!note || !validateForm()) return;

    setIsSubmitting(true);
    try {
      await updateNote(note.id, {
        code: formData.code,
        title: formData.title,
        url: formData.url,
        accessType: formData.accessType,
        type: formData.type,
        position: formData.position,
        isActive: formData.isActive,
        subject: formData.subject,
        notesBy: formData.notesBy,
      });

      toast.success("Note updated successfully");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update note"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update note details for {note?.notesCode}
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Code */}
          <div className="grid gap-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              placeholder="Enter code"
            />
          </div>
          {/* Subject */}
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Popover
              open={subjectDropdownOpen}
              onOpenChange={setSubjectDropdownOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {formData.subject || "Select subject..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search subjects..."
                    value={subjectSearchQuery}
                    onChange={(e) => handleSubjectSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  {subjectsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading...</span>
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No subjects found.
                    </div>
                  ) : (
                    <>
                      {subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                          onClick={() => handleSubjectSelect(subject)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.subject === subject.displayName
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          <span className="truncate flex-1">
                            {subject.displayName} ({subject.code})
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                {/* Pagination Controls */}
                {subjectPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevSubjectPage}
                      disabled={subjectsLoading || subjectPagination.currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {subjectPagination.currentPage + 1} / {subjectPagination.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNextSubjectPage}
                      disabled={subjectsLoading || subjectPagination.currentPage >= subjectPagination.totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter title"
            />
          </div>

          {/* Notes By */}
          <div className="grid gap-2">
            <Label htmlFor="notesBy">Notes By</Label>
            <Input
              id="notesBy"
              value={formData.notesBy}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notesBy: e.target.value }))
              }
              placeholder="Enter author/creator name"
            />
          </div>

          {/* URL */}
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="Enter notes URL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTES_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Access Type */}
            <div className="grid gap-2">
              <Label htmlFor="accessType">Access Type</Label>
              <Select
                value={formData.accessType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, accessType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCESS_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Position (Display Order) */}
            <div className="grid gap-2">
              <Label htmlFor="position">Position (Display Order)</Label>
              <Input
                id="position"
                type="number"
                value={formData.position}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    position: Number(e.target.value),
                  }))
                }
                placeholder="Enter position"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-xs text-muted-foreground">Enable/disable</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
