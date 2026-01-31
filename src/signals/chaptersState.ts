import { signal } from "@preact/signals-react";
import { toast } from "sonner";
import type { ChapterDto, FilterOption } from "@/types/chapters";
import {
  fetchChapters,
  fetchExams,
  fetchGradesByExam,
  fetchStreamsByExamGrade,
  fetchBatches,
  fetchBatchAddOns,
  fetchSubjects,
} from "@/services/chapters";

// ============================================
// CHAPTER LIST STATE
// ============================================

export const chapters = signal<ChapterDto[]>([]);
export const chaptersLoading = signal(true);
export const totalElements = signal(0);
export const totalPages = signal(0);
export const currentPage = signal(0);
export const pageSize = 20;

// ============================================
// FILTER OPTIONS STATE (Dropdown Data)
// ============================================

export const exams = signal<FilterOption[]>([]);
export const grades = signal<FilterOption[]>([]);
export const streams = signal<FilterOption[]>([]);
export const batches = signal<FilterOption[]>([]);
export const batchAddOns = signal<FilterOption[]>([]);
export const subjects = signal<FilterOption[]>([]);

// ============================================
// FILTER VALUES STATE (Selected IDs)
// ============================================

export const examFilter = signal("");
export const gradeFilter = signal("");
export const streamFilter = signal("");
export const batchFilter = signal("");
export const batchAddOnFilter = signal("");
export const subjectFilter = signal("");
export const chapterCodeFilter = signal("");

// ============================================
// LOADING STATES FOR CASCADING DROPDOWNS
// ============================================

export const loadingGrades = signal(false);
export const loadingStreams = signal(false);
export const loadingBatches = signal(false);
export const loadingBatchAddOns = signal(false);

// ============================================
// SELECTED CHAPTERS STATE
// ============================================

export const selectedChapters = signal<Set<string>>(new Set());
export const chapterToDelete = signal<ChapterDto | null>(null);

// ============================================
// SUBMITTING STATE
// ============================================

export const isDeleting = signal(false);
export const isTogglingStatus = signal<string | null>(null);

// ============================================
// MAPPING VIEW STATE
// ============================================

export const showMappingView = signal(false);
export const mappingDisplayOrders = signal<Record<string, number>>({});
export const isSavingMapping = signal(false);

// Mapping filters (separate from table filters)
export const mappingExamFilter = signal("");
export const mappingGradeFilter = signal("");
export const mappingStreamFilter = signal("");
export const mappingBatchFilter = signal("");
export const mappingBatchAddOnFilter = signal("");

// Mapping filter options
export const mappingGrades = signal<FilterOption[]>([]);
export const mappingStreams = signal<FilterOption[]>([]);
export const mappingBatches = signal<FilterOption[]>([]);
export const mappingBatchAddOns = signal<FilterOption[]>([]);

// Loading states for mapping dropdowns
export const loadingMappingGrades = signal(false);
export const loadingMappingStreams = signal(false);
export const loadingMappingBatches = signal(false);
export const loadingMappingBatchAddOns = signal(false);

// ============================================
// ACTIONS
// ============================================

export const loadChapters = async () => {
  chaptersLoading.value = true;
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      size: pageSize,
    };

    if (examFilter.value) params.examId = examFilter.value;
    if (gradeFilter.value) params.gradeId = gradeFilter.value;
    if (streamFilter.value) params.streamId = streamFilter.value;
    if (batchFilter.value) params.batchId = batchFilter.value;
    if (batchAddOnFilter.value) params.batchAddOnId = batchAddOnFilter.value;
    if (subjectFilter.value) params.subjectId = subjectFilter.value;
    if (chapterCodeFilter.value) params.chapterCode = chapterCodeFilter.value;

    console.log("[ChaptersState] Loading chapters with params:", params);
    const response = await fetchChapters(params);

    chapters.value = response.content || [];
    totalElements.value = response.totalElements || 0;
    totalPages.value = response.totalPages || 0;

    console.log("[ChaptersState] Set chapters:", chapters.value.length, "items");
  } catch (error) {
    console.error("[ChaptersState] Failed to load chapters:", error);
    toast.error(
      "Failed to load chapters: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    chapters.value = [];
    totalElements.value = 0;
    totalPages.value = 0;
  } finally {
    chaptersLoading.value = false;
  }
};

export const loadExams = async () => {
  try {
    const response = await fetchExams();
    exams.value = response.content;
  } catch (error) {
    console.error("[ChaptersState] Failed to load exams:", error);
  }
};

export const loadGrades = async (examId: string) => {
  if (!examId) {
    grades.value = [];
    return;
  }
  loadingGrades.value = true;
  try {
    const response = await fetchGradesByExam({ examId: Number(examId) });
    grades.value = response.content;
  } catch (error) {
    console.error("[ChaptersState] Failed to load grades:", error);
    grades.value = [];
  } finally {
    loadingGrades.value = false;
  }
};

export const loadStreams = async (examId: string, gradeId: string) => {
  if (!examId || !gradeId) {
    streams.value = [];
    return;
  }
  loadingStreams.value = true;
  try {
    const response = await fetchStreamsByExamGrade({ examId: Number(examId), gradeId: Number(gradeId) });
    streams.value = response.content;
  } catch (error) {
    console.error("[ChaptersState] Failed to load streams:", error);
    streams.value = [];
  } finally {
    loadingStreams.value = false;
  }
};

export const loadBatchOptions = async (examId: string, gradeId: string, streamId: string) => {
  if (!examId || !gradeId || !streamId) {
    batches.value = [];
    return;
  }
  loadingBatches.value = true;
  try {
    const response = await fetchBatches({
      examId: Number(examId),
      gradeId: Number(gradeId),
      streamId: Number(streamId),
    });
    batches.value = response.content;
  } catch (error) {
    console.error("[ChaptersState] Failed to load batches:", error);
    batches.value = [];
  } finally {
    loadingBatches.value = false;
  }
};

export const loadBatchAddOnOptions = async (batchId: string) => {
  if (!batchId) {
    batchAddOns.value = [];
    return;
  }
  loadingBatchAddOns.value = true;
  try {
    const response = await fetchBatchAddOns({ batchId: Number(batchId) });
    batchAddOns.value = response.content;
  } catch (error) {
    console.error("[ChaptersState] Failed to load batch add-ons:", error);
    batchAddOns.value = [];
  } finally {
    loadingBatchAddOns.value = false;
  }
};

export const loadSubjects = async () => {
  try {
    const response = await fetchSubjects();
    subjects.value = response.content;
  } catch (error) {
    console.error("[ChaptersState] Failed to load subjects:", error);
  }
};

export const toggleChapterSelection = (chapterId: string) => {
  const current = new Set(selectedChapters.value);
  if (current.has(chapterId)) {
    current.delete(chapterId);
  } else {
    current.add(chapterId);
  }
  selectedChapters.value = current;
};

export const selectAllChapters = () => {
  selectedChapters.value = new Set(chapters.value.map((c) => c.chapterId));
};

export const clearAllSelections = () => {
  selectedChapters.value = new Set();
};

export const setPage = (page: number) => {
  currentPage.value = page;
};

export const clearFilters = () => {
  examFilter.value = "";
  gradeFilter.value = "";
  streamFilter.value = "";
  batchFilter.value = "";
  batchAddOnFilter.value = "";
  subjectFilter.value = "";
  chapterCodeFilter.value = "";
  grades.value = [];
  streams.value = [];
  batches.value = [];
  batchAddOns.value = [];
  currentPage.value = 0;
};

export const resetChaptersState = () => {
  chapters.value = [];
  selectedChapters.value = new Set();
  chapterToDelete.value = null;
  clearFilters();
  showMappingView.value = false;
  mappingDisplayOrders.value = {};
};
