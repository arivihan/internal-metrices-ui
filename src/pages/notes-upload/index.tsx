import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Copy,
  Pencil,
  ExternalLink,
  History,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Check,
  Trash,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { AddNotesDialog } from "./AddNotesDialog";
import { CreateNoteDialog } from "./CreateNoteDialog";
import { DuplicateNotesDialog } from "./DuplicateNotesDialog";
import { EditNotesDialog } from "./EditNotesDialog";
import { ViewNoteDetailsDialog } from "./ViewNoteDetailsDialog";
import { fetchNotes, deleteNote, fetchNoteAuditTrail, fetchNotesTableAuditTrail, fetchBatchesPaginated } from "@/services/notes";
import type { NotesResponseDto, NotesFilters } from "@/types/notes";
import { AuditTrailPopup } from "@/components/AuditTrailPopup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NOTES_TYPES = {
  PREVIOUS_YEAR_PAPER: "Previous Year Paper",
  NOTES: "Notes",
  SAMPLE_PAPER: "Sample Paper",
  PRACTICE_SET: "Practice Set",
};

export default function NotesUploadPage() {
  const [notes, setNotes] = useState<NotesResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false);
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<NotesResponseDto[]>([]);
  const [editingNote, setEditingNote] = useState<NotesResponseDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<NotesResponseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audit Trail state
  const [auditTrailOpen, setAuditTrailOpen] = useState(false);
  const [auditTrailData, setAuditTrailData] = useState<any[]>([]);
  const [auditTrailLoading, setAuditTrailLoading] = useState(false);
  const [auditTrailTitle, setAuditTrailTitle] = useState("Audit Trail");
  const [auditTrailPagination, setAuditTrailPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [currentAuditNoteId, setCurrentAuditNoteId] = useState<string | null>(null);
  const [isTableAudit, setIsTableAudit] = useState(false);
  const [filters, setFilters] = useState<NotesFilters>({
    pageNo: 0,
    pageSize: 20,
    sortBy: "displayOrder",
    sortDir: "ASC",
    active: true,
  });
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Batch dropdown state
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [batchPagination, setBatchPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [filters]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      console.log("[NotesUploadPage] Loading notes with filters:", filters);
      const response = await fetchNotes(filters);
      console.log("[NotesUploadPage] Notes response:", response);

      setNotes(response.content || []);
      setTotalElements(response.totalElements || 0);

      console.log(
        "[NotesUploadPage] Set notes:",
        response.content?.length || 0,
        "items"
      );
    } catch (error) {
      console.error("[NotesUploadPage] Failed to load notes:", error);
      toast.error(
        "Failed to load notes: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setNotes([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({
      ...prev,
      search: query || undefined,
      pageNo: 0, // Reset to first page on search
    }));
  };

  // Batch loading functions
  const loadBatches = async (pageNo: number = 0, search?: string) => {
    setBatchesLoading(true);
    try {
      const response = await fetchBatchesPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        activeFlag: true,
        sortBy: "displayOrder",
        sortDir: "ASC",
      });

      // Replace batches for page-based navigation
      setBatches(response.content || []);

      setBatchPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("[NotesUploadPage] Failed to load batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setBatchesLoading(false);
    }
  };

  const handleBatchSearch = (query: string) => {
    setBatchSearchQuery(query);
    loadBatches(0, query);
  };

  const handleBatchSelect = (batch: any | null) => {
    setSelectedBatch(batch);
    setFilters((prev) => ({
      ...prev,
      batchId: batch?.id || undefined,
      pageNo: 0,
    }));
    setBatchDropdownOpen(false);
  };

  const handlePrevBatchPage = () => {
    if (batchPagination.currentPage > 0) {
      loadBatches(batchPagination.currentPage - 1, batchSearchQuery);
    }
  };

  const handleNextBatchPage = () => {
    if (batchPagination.currentPage < batchPagination.totalPages - 1) {
      loadBatches(batchPagination.currentPage + 1, batchSearchQuery);
    }
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      pageNo: 0,
    }));
  };

  const handleSortDirChange = (sortDir: "ASC" | "DESC") => {
    setFilters((prev) => ({
      ...prev,
      sortDir,
      pageNo: 0,
    }));
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      active: status === "all" ? undefined : status === "active",
      pageNo: 0,
    }));
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedBatch(null);
    setFilters({
      pageNo: 0,
      pageSize: 20,
      sortBy: "displayOrder",
      sortDir: "ASC",
      active: true,
    });
  };

  // Load batches when dropdown opens
  useEffect(() => {
    if (batchDropdownOpen && batches.length === 0) {
      loadBatches(0);
    }
  }, [batchDropdownOpen]);

  const handleUploadSuccess = () => {
    toast.success("Notes uploaded successfully!");
    loadNotes(); // Refresh the list
  };

  const handleSelectNote = (note: NotesResponseDto, checked: boolean) => {
    if (checked) {
      setSelectedNotes((prev) => [...prev, note]);
    } else {
      setSelectedNotes((prev) => prev.filter((n) => n.id !== note.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotes([...notes]);
    } else {
      setSelectedNotes([]);
    }
  };

  const isNoteSelected = (noteId: string) => {
    return selectedNotes.some((n) => n.id === noteId);
  };

  const isAllSelected =
    notes.length > 0 && selectedNotes.length === notes.length;
  const isIndeterminate =
    selectedNotes.length > 0 && selectedNotes.length < notes.length;

  const handleDuplicateSuccess = () => {
    toast.success("Notes duplicated successfully!");
    setSelectedNotes([]); // Clear selections
    loadNotes(); // Refresh the list
  };

  const handleEditClick = (note: NotesResponseDto) => {
    setEditingNote(note);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    loadNotes(); // Refresh the list
  };

  const handleDeleteClick = (note: NotesResponseDto) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    setIsDeleting(true);
    try {
      await deleteNote(noteToDelete.id);
      toast.success("Note deleted successfully!");
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      loadNotes(); // Refresh the list
    } catch (error) {
      console.error("[NotesUploadPage] Failed to delete note:", error);
      toast.error(
        "Failed to delete note: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetailsClick = (note: NotesResponseDto) => {
    setViewingNoteId(note.id);
    setShowViewDetailsDialog(true);
  };

  // Audit Trail handlers
  const handleRowAuditClick = async (note: NotesResponseDto) => {
    setCurrentAuditNoteId(note.id);
    setIsTableAudit(false);
    setAuditTrailTitle(`Audit Trail - ${note.title}`);
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(note.id, 0, false);
  };

  const handleTableAuditClick = async () => {
    setCurrentAuditNoteId(null);
    setIsTableAudit(true);
    setAuditTrailTitle("Notes Table Audit Trail");
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(null, 0, true);
  };

  const fetchAuditTrailPage = async (
    noteId: string | null,
    pageNo: number,
    tableAudit: boolean,
    pageSizeParam?: number
  ) => {
    const size = pageSizeParam ?? auditTrailPagination.pageSize;
    setAuditTrailLoading(true);
    try {
      let response;
      if (tableAudit) {
        response = await fetchNotesTableAuditTrail(pageNo, size);
      } else if (noteId) {
        response = await fetchNoteAuditTrail(noteId, pageNo, size);
      } else {
        return;
      }

      setAuditTrailData(response.content || []);
      setAuditTrailPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? size,
      });
    } catch (error) {
      console.error("[NotesUploadPage] Failed to fetch audit trail:", error);
      toast.error("Failed to load audit trail");
      setAuditTrailData([]);
    } finally {
      setAuditTrailLoading(false);
    }
  };

  const handleAuditPageChange = (newPage: number) => {
    fetchAuditTrailPage(currentAuditNoteId, newPage, isTableAudit);
  };

  const handleAuditPageSizeChange = (newPageSize: number) => {
    // Reset to first page when changing page size
    fetchAuditTrailPage(currentAuditNoteId, 0, isTableAudit, newPageSize);
  };

  const getNotesTypeDisplay = (type: string) => {
    return NOTES_TYPES[type as keyof typeof NOTES_TYPES] || type;
  };

  const formatFileSize = (url: string) => {
    // Since we don't have file size info, just show a placeholder
    return "Unknown";
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes Upload</h1>
          <p className="text-muted-foreground">
            Manage and upload notes for different batches
            {selectedNotes.length > 0 && (
              <span className="ml-2 text-cyan-600">
                • {selectedNotes.length} note
                {selectedNotes.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedNotes.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(true)}
              className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate ({selectedNotes.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleTableAuditClick}>
            <History className="mr-2 h-4 w-4" />
            Table Audit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Notes
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Single Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
                <Download className="mr-2 h-4 w-4" />
                Bulk Upload
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-3 overflow-visible">
        {/* Search Field */}
        <div className="relative w-60 shrink-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, subject, notesBy..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Batch Dropdown with Pagination */}
        <Popover open={batchDropdownOpen} onOpenChange={setBatchDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={batchDropdownOpen}
              className="w-56 justify-between shrink-0"
            >
              <span className="truncate">
                {selectedBatch ? selectedBatch.name : "Select Batch..."}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0"
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
            <div className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Clear selection option */}
              <div
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                onClick={() => handleBatchSelect(null)}
              >
                <Check
                  className={`mr-2 h-4 w-4 shrink-0 ${
                    !selectedBatch ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span>All Batches</span>
              </div>
              {batchesLoading ? (
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
                          selectedBatch?.id === batch.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {batch.displayName || batch.name}
                        </span>
                        {batch.code && (
                          <span className="text-xs text-muted-foreground truncate">
                            {batch.code}
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
                  disabled={batchesLoading || batchPagination.currentPage === 0}
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
                    batchesLoading ||
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

        {/* Sort By Dropdown */}
        <Select
          value={filters.sortBy || "displayOrder"}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-36 shrink-0">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="displayOrder">Display Order</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="subjectName">Subject</SelectItem>
            <SelectItem value="notesBy">Notes By</SelectItem>
            <SelectItem value="notesType">Type</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Direction Dropdown */}
        <Select
          value={filters.sortDir || "ASC"}
          onValueChange={(value) =>
            handleSortDirChange(value as "ASC" | "DESC")
          }
        >
          <SelectTrigger className="w-28 shrink-0">
            <SelectValue placeholder="Sort Dir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">Ascending</SelectItem>
            <SelectItem value="DESC">Descending</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={
            filters.active === undefined
              ? "all"
              : filters.active
                ? "active"
                : "inactive"
          }
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-28 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filters Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleResetFilters}
          title="Reset Filters"
          className="shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Export Button */}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{totalElements}</div>
          <p className="text-xs text-muted-foreground">Total Notes</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {notes.filter((n) => n.isActive).length}
          </div>
          <p className="text-xs text-muted-foreground">Active Notes</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {notes.filter((n) => n.locked).length}
          </div>
          <p className="text-xs text-muted-foreground">Locked Notes</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {
              new Set(
                notes.flatMap((n) => n.batches?.map((b) => b.batchId) || []),
              ).size
            }
          </div>
          <p className="text-xs text-muted-foreground">Unique Batches</p>
        </div>
      </div>

      {/* Notes Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                {/* Custom Checkbox with indeterminate state */}
                <Checkbox
                  checked={isAllSelected ? true : isIndeterminate ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all notes"
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Notes By</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Batch Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[90px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[70px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[50px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[40px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-muted-foreground">No notes found.</p>
                    <Button
                      variant="link"
                      onClick={() => setShowAddDialog(true)}
                      className="mt-2"
                    >
                      Upload your first notes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>
                    <Checkbox
                      checked={isNoteSelected(note.id)}
                      onCheckedChange={(checked) =>
                        handleSelectNote(note, checked as boolean)
                      }
                      aria-label={`Select note ${note.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{note.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Code: {note.code || note.notesCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{note.subject || note.subjectName}</TableCell>
                  <TableCell>{note.notesBy}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getNotesTypeDisplay(note.type || note.notesType || "")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      {note.batches && note.batches.length > 0 ? (
                        <span className="text-xs break-words block">
                          {note.batches[0].batchCode}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={note.isActive ? "default" : "secondary"}
                        className={
                          note.isActive ? "bg-green-100 text-green-800" : ""
                        }
                      >
                        {note.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {note.locked && (
                        <Badge variant="destructive">Locked</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{note.displayOrder}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetailsClick(note)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(note.url || note.notesUrl, "_blank")
                          }
                          className="cursor-pointer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Notes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(note)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 cursor-pointer"
                          onClick={() => handleDeleteClick(note)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRowAuditClick(note)}
                          className="cursor-pointer"
                        >
                          <History className="mr-2 h-4 w-4" />
                          Audit Trail
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalElements > filters.pageSize! && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {notes.length} of {totalElements} notes
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  pageNo: Math.max(0, prev.pageNo! - 1),
                }))
              }
              disabled={filters.pageNo === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters((prev) => ({ ...prev, pageNo: prev.pageNo! + 1 }))
              }
              disabled={notes.length < filters.pageSize!}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Notes Dialog (Bulk Upload) */}
      <AddNotesDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleUploadSuccess}
      />

      {/* Create Single Note Dialog */}
      <CreateNoteDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleUploadSuccess}
      />

      {/* Duplicate Notes Dialog */}
      <DuplicateNotesDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        selectedNotes={selectedNotes}
        onSuccess={handleDuplicateSuccess}
      />

      {/* Edit Notes Dialog */}
      <EditNotesDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        note={editingNote}
        onSuccess={handleEditSuccess}
      />

      {/* View Note Details Dialog */}
      <ViewNoteDetailsDialog
        open={showViewDetailsDialog}
        onOpenChange={setShowViewDetailsDialog}
        noteId={viewingNoteId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{noteToDelete?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash/>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Trail Popup */}
      <AuditTrailPopup
        open={auditTrailOpen}
        onClose={() => {
          setAuditTrailOpen(false);
          setAuditTrailData([]);
          setCurrentAuditNoteId(null);
        }}
        data={auditTrailData}
        title={auditTrailTitle}
        currentPage={auditTrailPagination.currentPage}
        totalPages={auditTrailPagination.totalPages}
        totalElements={auditTrailPagination.totalElements}
        pageSize={auditTrailPagination.pageSize}
        isLoading={auditTrailLoading}
        onPageChange={handleAuditPageChange}
        onPageSizeChange={handleAuditPageSizeChange}
      />
    </div>
  );
}
