import { signal, computed } from "@preact/signals-react";
import type {
  CarouselListResponse,
  CarouselDetailResponse,
  CarouselFilters,
  BatchOption,
} from "@/types/carousels";
import {
  fetchCarousels,
  fetchCarouselById,
  fetchAllBatchesForCarousels,
  deleteCarousel as deleteCarouselApi,
  toggleCarouselStatus as toggleCarouselStatusApi,
} from "@/services/carousels";
import { toast } from "sonner";

// ============================================
// CAROUSEL LIST STATE
// ============================================

/** List of carousels from API */
export const carousels = signal<CarouselListResponse[]>([]);

/** Loading state for carousel list */
export const carouselsLoading = signal(true);

/** Total elements for pagination */
export const totalElements = signal(0);

/** Filters for API (pagination, sorting) */
export const carouselFilters = signal<CarouselFilters>({
  pageNo: 0,
  pageSize: 20,
  sortBy: "createdAt",
  sortDir: "DESC",
});

/** Search query */
export const searchQuery = signal("");

// ============================================
// SELECTED CAROUSEL STATE
// ============================================

/** Currently selected carousel (for edit/delete/toggle) */
export const selectedCarousel = signal<CarouselListResponse | null>(null);

/** Multiple selected carousels (for copy) */
export const selectedCarousels = signal<CarouselListResponse[]>([]);

/** Full carousel details (fetched by ID) - shared between Edit & View dialogs */
export const selectedCarouselDetails = signal<CarouselDetailResponse | null>(null);

/** Loading state for fetching carousel details */
export const detailsLoading = signal(false);

// ============================================
// BATCH OPTIONS STATE
// ============================================

/** Batch options for dropdowns */
export const batches = signal<BatchOption[]>([]);

// ============================================
// SUBMITTING STATE
// ============================================

/** Submitting state for delete/toggle operations */
export const isSubmitting = signal(false);

// ============================================
// COMPUTED VALUES
// ============================================

/** Check if any carousel is selected */
export const hasSelection = computed(() => selectedCarousels.value.length > 0);

/** Get selected carousel IDs */
export const selectedCarouselIds = computed(() =>
  selectedCarousels.value.map(c => c.id)
);

// ============================================
// ACTIONS
// ============================================

/**
 * Load carousels from API
 */
export const loadCarousels = async () => {
  carouselsLoading.value = true;
  try {
    console.log("[CarouselState] Loading carousels with filters:", carouselFilters.value);
    const response = await fetchCarousels(carouselFilters.value);
    console.log("[CarouselState] Carousels response:", response);

    carousels.value = response.content || [];
    totalElements.value = response.totalElements || 0;

    console.log("[CarouselState] Set carousels:", carousels.value.length, "items");
  } catch (error) {
    console.error("[CarouselState] Failed to load carousels:", error);
    toast.error(
      "Failed to load carousels: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    carousels.value = [];
    totalElements.value = 0;
  } finally {
    carouselsLoading.value = false;
  }
};

/**
 * Load batches from API
 */
export const loadBatches = async () => {
  try {
    const batchData = await fetchAllBatchesForCarousels();
    batches.value = batchData;
  } catch (error) {
    console.error("[CarouselState] Failed to load batches:", error);
  }
};

/**
 * Load carousel details by ID
 */
export const loadCarouselDetails = async (carouselId: number) => {
  detailsLoading.value = true;
  try {
    console.log("[CarouselState] Fetching details for:", carouselId);
    const details = await fetchCarouselById(carouselId);
    selectedCarouselDetails.value = details;
    console.log("[CarouselState] Carousel details loaded:", details);
    return details;
  } catch (error) {
    console.error("[CarouselState] Failed to load carousel details:", error);
    toast.error("Failed to load carousel details");
    throw error;
  } finally {
    detailsLoading.value = false;
  }
};

/**
 * Clear selected carousel details
 */
export const clearCarouselDetails = () => {
  selectedCarouselDetails.value = null;
};

/**
 * Delete carousel
 */
export const deleteSelectedCarousel = async () => {
  if (!selectedCarousel.value) return;

  isSubmitting.value = true;
  try {
    await deleteCarouselApi(selectedCarousel.value.id);
    toast.success("Carousel deleted successfully!");
    selectedCarousel.value = null;
    await loadCarousels();
    return true;
  } catch (error) {
    console.error("[CarouselState] Failed to delete carousel:", error);
    toast.error(
      "Failed to delete carousel: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * Toggle carousel status
 */
export const toggleSelectedCarouselStatus = async () => {
  if (!selectedCarousel.value) return;

  isSubmitting.value = true;
  try {
    await toggleCarouselStatusApi(
      selectedCarousel.value.id,
      !selectedCarousel.value.isActive
    );
    toast.success(
      `Carousel ${selectedCarousel.value.isActive ? "deactivated" : "activated"} successfully!`
    );
    selectedCarousel.value = null;
    await loadCarousels();
    return true;
  } catch (error) {
    console.error("[CarouselState] Failed to toggle carousel status:", error);
    toast.error(
      "Failed to toggle status: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

/**
 * Select/Deselect a carousel for multi-select
 */
export const toggleCarouselSelection = (carousel: CarouselListResponse) => {
  const current = selectedCarousels.value;
  const isSelected = current.some(c => c.id === carousel.id);

  if (isSelected) {
    selectedCarousels.value = current.filter(c => c.id !== carousel.id);
  } else {
    selectedCarousels.value = [...current, carousel];
  }
};

/**
 * Select all carousels
 */
export const selectAllCarousels = () => {
  selectedCarousels.value = [...carousels.value];
};

/**
 * Clear all selections
 */
export const clearAllSelections = () => {
  selectedCarousels.value = [];
};

/**
 * Update filters
 */
export const updateFilters = (newFilters: Partial<CarouselFilters>) => {
  carouselFilters.value = { ...carouselFilters.value, ...newFilters };
};

/**
 * Reset all carousel state (call on unmount or page leave)
 */
export const resetCarouselState = () => {
  carousels.value = [];
  selectedCarousel.value = null;
  selectedCarousels.value = [];
  selectedCarouselDetails.value = null;
  searchQuery.value = "";
  carouselFilters.value = {
    pageNo: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  };
};
