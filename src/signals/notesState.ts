import { signal } from "@preact/signals-react";
import { toast } from "sonner";
import type { NotesResponseDto, NotesFilters } from "@/types/notes";
import { fetchNotes, deleteNote as deleteNoteApi } from "@/services/notes";

// ============================================
// NOTES LIST STATE
// ============================================

export const notes = signal<NotesResponseDto[]>([]);
export const notesLoading = signal(true);
export const totalElements = signal(0);

export const notesFilters = signal<NotesFilters>({
  pageNo: 0,
  pageSize: 20,
  sortBy: "displayOrder",
  sortDir: "ASC",
  active: true,
});

export const searchQuery = signal("");

// ============================================
// SELECTED NOTE STATE
// ============================================

export const selectedNote = signal<NotesResponseDto | null>(null);
export const selectedNotes = signal<NotesResponseDto[]>([]);
export const editingNote = signal<NotesResponseDto | null>(null);

// ============================================
// BATCH OPTIONS STATE
// ============================================

export const batches = signal<any[]>([]);
export const selectedBatch = signal<any | null>(null);

// ============================================
// SUBMITTING STATE
// ============================================

export const isSubmitting = signal(false);

// ============================================
// ACTIONS
// ============================================

export const loadNotes = async () => {
  notesLoading.value = true;
  try {
    console.log("[NotesState] Loading notes with filters:", notesFilters.value);
    const response = await fetchNotes(notesFilters.value);

    notes.value = response.content || [];
    totalElements.value = response.totalElements || 0;

    console.log("[NotesState] Set notes:", notes.value.length, "items");
  } catch (error) {
    console.error("[NotesState] Failed to load notes:", error);
    toast.error(
      "Failed to load notes: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    notes.value = [];
    totalElements.value = 0;
  } finally {
    notesLoading.value = false;
  }
};

export const deleteSelectedNote = async () => {
  if (!selectedNote.value) return false;

  isSubmitting.value = true;
  try {
    await deleteNoteApi(selectedNote.value.code);
    toast.success("Note deleted successfully!");
    selectedNote.value = null;
    await loadNotes();
    return true;
  } catch (error) {
    console.error("[NotesState] Failed to delete note:", error);
    toast.error("Failed to delete note");
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

export const toggleNoteSelection = (note: NotesResponseDto) => {
  const current = selectedNotes.value;
  const isSelected = current.some((n) => n.code === note.code);

  if (isSelected) {
    selectedNotes.value = current.filter((n) => n.code !== note.code);
  } else {
    selectedNotes.value = [...current, note];
  }
};

export const selectAllNotes = () => {
  selectedNotes.value = [...notes.value];
};

export const clearAllSelections = () => {
  selectedNotes.value = [];
};

export const updateFilters = (newFilters: Partial<NotesFilters>) => {
  notesFilters.value = { ...notesFilters.value, ...newFilters };
};

export const resetNotesState = () => {
  notes.value = [];
  selectedNote.value = null;
  selectedNotes.value = [];
  editingNote.value = null;
  searchQuery.value = "";
  notesFilters.value = {
    pageNo: 0,
    pageSize: 20,
    sortBy: "displayOrder",
    sortDir: "ASC",
    active: true,
  };
};
