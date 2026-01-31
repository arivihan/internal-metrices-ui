import { signal } from "@preact/signals-react";
import { toast } from "sonner";
import type {
  HomeScreenCardListResponse,
  HomeScreenCardFilters,
} from "@/types/homeScreenCards";
import {
  fetchHomeScreenCards,
  fetchAllBatchesForCards,
  deleteHomeScreenCard as deleteCardApi,
  toggleHomeScreenCardStatus as toggleCardStatusApi,
} from "@/services/homeScreenCards";

// ============================================
// BATCH OPTION TYPE
// ============================================

interface BatchOption {
  id: number;
  name: string;
  code?: string;
}

// ============================================
// CARDS LIST STATE
// ============================================

export const cards = signal<HomeScreenCardListResponse[]>([]);
export const cardsLoading = signal(true);
export const totalElements = signal(0);

export const cardFilters = signal<HomeScreenCardFilters>({
  pageNo: 0,
  pageSize: 20,
  sortBy: "createdAt",
  sortDir: "DESC",
});

export const searchQuery = signal("");

// ============================================
// SELECTED CARD STATE
// ============================================

export const selectedCard = signal<HomeScreenCardListResponse | null>(null);
export const selectedCards = signal<HomeScreenCardListResponse[]>([]);

// ============================================
// BATCH OPTIONS STATE
// ============================================

export const batches = signal<BatchOption[]>([]);

// ============================================
// SUBMITTING STATE
// ============================================

export const isSubmitting = signal(false);

// ============================================
// ACTIONS
// ============================================

export const loadCards = async () => {
  cardsLoading.value = true;
  try {
    console.log("[HomeScreenCardsState] Loading cards with filters:", cardFilters.value);
    const response = await fetchHomeScreenCards(cardFilters.value);

    cards.value = response.content || [];
    totalElements.value = response.totalElements || 0;

    console.log("[HomeScreenCardsState] Set cards:", cards.value.length, "items");
  } catch (error) {
    console.error("[HomeScreenCardsState] Failed to load cards:", error);
    toast.error(
      "Failed to load cards: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    cards.value = [];
    totalElements.value = 0;
  } finally {
    cardsLoading.value = false;
  }
};

export const loadBatches = async () => {
  try {
    const batchData = await fetchAllBatchesForCards({ activeFlag: true });
    batches.value = batchData;
  } catch (error) {
    console.error("[HomeScreenCardsState] Failed to load batches:", error);
  }
};

export const deleteSelectedCard = async () => {
  if (!selectedCard.value) return false;

  isSubmitting.value = true;
  try {
    await deleteCardApi(selectedCard.value.id);
    toast.success("Card deleted successfully!");
    selectedCard.value = null;
    await loadCards();
    return true;
  } catch (error) {
    console.error("[HomeScreenCardsState] Failed to delete card:", error);
    toast.error("Failed to delete card");
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

export const toggleSelectedCardStatus = async () => {
  if (!selectedCard.value) return false;

  isSubmitting.value = true;
  try {
    await toggleCardStatusApi(
      selectedCard.value.id,
      !selectedCard.value.isActive
    );
    toast.success(
      `Card ${selectedCard.value.isActive ? "deactivated" : "activated"} successfully!`
    );
    selectedCard.value = null;
    await loadCards();
    return true;
  } catch (error) {
    console.error("[HomeScreenCardsState] Failed to toggle card status:", error);
    toast.error("Failed to update card status");
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

export const toggleCardSelection = (card: HomeScreenCardListResponse) => {
  const current = selectedCards.value;
  const isSelected = current.some((c) => c.id === card.id);

  if (isSelected) {
    selectedCards.value = current.filter((c) => c.id !== card.id);
  } else {
    selectedCards.value = [...current, card];
  }
};

export const selectAllCards = () => {
  selectedCards.value = [...cards.value];
};

export const clearAllSelections = () => {
  selectedCards.value = [];
};

export const updateFilters = (newFilters: Partial<HomeScreenCardFilters>) => {
  cardFilters.value = { ...cardFilters.value, ...newFilters };
};

export const resetCardState = () => {
  cards.value = [];
  selectedCard.value = null;
  selectedCards.value = [];
  searchQuery.value = "";
  cardFilters.value = {
    pageNo: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  };
};
