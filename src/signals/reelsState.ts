import { signal } from "@preact/signals-react";
import { toast } from "sonner";
import type {
  ReelResponseDto,
  ReelFilters,
  ExamOption,
  GradeOption,
  StreamOption,
  TagResponseDto,
} from "@/types/reels";
import {
  fetchReels,
  deleteReels as deleteReelsApi,
  updateReelStatus as updateReelStatusApi,
} from "@/services/reels";

// ============================================
// REELS LIST STATE
// ============================================

export const reels = signal<ReelResponseDto[]>([]);
export const reelsLoading = signal(true);
export const totalElements = signal(0);

export const reelFilters = signal<ReelFilters>({
  pageNo: 0,
  pageSize: 20,
  sortBy: "createdAt",
  sortDir: "DESC",
});

export const searchQuery = signal("");

// ============================================
// SELECTED REEL STATE
// ============================================

export const selectedReel = signal<ReelResponseDto | null>(null);
export const selectedReels = signal<ReelResponseDto[]>([]);
export const editingReel = signal<ReelResponseDto | null>(null);
export const detailReel = signal<ReelResponseDto | null>(null);

// ============================================
// FILTER OPTIONS STATE
// ============================================

export const exams = signal<ExamOption[]>([]);
export const grades = signal<GradeOption[]>([]);
export const streams = signal<StreamOption[]>([]);
export const tags = signal<TagResponseDto[]>([]);

// ============================================
// SUBMITTING STATE
// ============================================

export const isSubmitting = signal(false);
export const isDeleting = signal(false);

// ============================================
// ACTIONS
// ============================================

export const loadReels = async () => {
  reelsLoading.value = true;
  try {
    console.log("[ReelsState] Loading reels with filters:", reelFilters.value);
    const response = await fetchReels(reelFilters.value);

    reels.value = response.content || [];
    totalElements.value = response.totalElements || 0;

    console.log("[ReelsState] Set reels:", reels.value.length, "items");
  } catch (error) {
    console.error("[ReelsState] Failed to load reels:", error);
    toast.error(
      "Failed to load reels: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    reels.value = [];
    totalElements.value = 0;
  } finally {
    reelsLoading.value = false;
  }
};

export const deleteSelectedReels = async (reelsToDelete: ReelResponseDto[]) => {
  if (reelsToDelete.length === 0) return false;

  isDeleting.value = true;
  try {
    const ids = reelsToDelete.map((r) => r.id);
    await deleteReelsApi(ids);
    toast.success(`${reelsToDelete.length} reel(s) deleted successfully!`);
    selectedReels.value = [];
    await loadReels();
    return true;
  } catch (error) {
    console.error("[ReelsState] Failed to delete reels:", error);
    toast.error("Failed to delete reels");
    return false;
  } finally {
    isDeleting.value = false;
  }
};

export const updateReelStatus = async (reelId: number, isActive: boolean) => {
  isSubmitting.value = true;
  try {
    await updateReelStatusApi(reelId, isActive);
    toast.success(`Reel ${isActive ? "activated" : "deactivated"} successfully!`);
    await loadReels();
    return true;
  } catch (error) {
    console.error("[ReelsState] Failed to update reel status:", error);
    toast.error("Failed to update reel status");
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

export const toggleReelSelection = (reel: ReelResponseDto) => {
  const current = selectedReels.value;
  const isSelected = current.some((r) => r.id === reel.id);

  if (isSelected) {
    selectedReels.value = current.filter((r) => r.id !== reel.id);
  } else {
    selectedReels.value = [...current, reel];
  }
};

export const selectAllReels = () => {
  selectedReels.value = [...reels.value];
};

export const clearAllSelections = () => {
  selectedReels.value = [];
};

export const updateFilters = (newFilters: Partial<ReelFilters>) => {
  reelFilters.value = { ...reelFilters.value, ...newFilters };
};

export const resetReelsState = () => {
  reels.value = [];
  selectedReel.value = null;
  selectedReels.value = [];
  editingReel.value = null;
  detailReel.value = null;
  searchQuery.value = "";
  reelFilters.value = {
    pageNo: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  };
};
