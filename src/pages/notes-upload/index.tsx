import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Copy,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { AddNotesDialog } from "./AddNotesDialog";
import { DuplicateNotesDialog } from "./DuplicateNotesDialog";
import { fetchNotes } from "@/services/notes";
import type { NotesResponseDto, NotesFilters } from "@/types/notes";

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
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<NotesResponseDto[]>([]);
  const [filters, setFilters] = useState<NotesFilters>({
    pageNo: 0,
    pageSize: 20,
    sortBy: "position",
    sortDir: "ASC",
    active: true,
  });
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

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
    // You can implement search logic here
    // For now, just trigger a reload
    loadNotes();
  };

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
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Notes
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
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
            {new Set(notes.map((n) => n.batchId)).size}
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
                <Checkbox
                  checked={isIndeterminate ? "indeterminate" : isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all notes"
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Notes By</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Batch ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Position</TableHead>
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
                        Code: {note.notesCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{note.subjectName}</TableCell>
                  <TableCell>{note.notesBy}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getNotesTypeDisplay(note.notesType)}
                    </Badge>
                  </TableCell>
                  <TableCell>{note.batchId}</TableCell>
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
                  <TableCell>{note.position}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(note.notesUrl, "_blank")}
                        >
                          View Notes
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete
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

      {/* Add Notes Dialog */}
      <AddNotesDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleUploadSuccess}
      />

      {/* Duplicate Notes Dialog */}
      <DuplicateNotesDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        selectedNotes={selectedNotes}
        onSuccess={handleDuplicateSuccess}
      />
    </div>
  );
}
