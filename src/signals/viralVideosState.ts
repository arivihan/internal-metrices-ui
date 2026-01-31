import { signal } from "@preact/signals-react";
import { toast } from "sonner";
import type {
  VideoResponseDto,
  VideoFilters,
  BatchOption,
} from "@/types/viralVideos";
import {
  fetchViralVideos,
  fetchAllBatchesForVideos,
  deleteVideo as deleteVideoApi,
  toggleVideoStatus as toggleVideoStatusApi,
} from "@/services/viralVideos";

// ============================================
// VIDEO LIST STATE
// ============================================

export const videos = signal<VideoResponseDto[]>([]);
export const videosLoading = signal(true);
export const totalElements = signal(0);

export const videoFilters = signal<VideoFilters>({
  pageNo: 0,
  pageSize: 20,
  sortBy: "displayOrder",
  sortDir: "ASC",
  active: true,
});

export const searchQuery = signal("");

// ============================================
// SELECTED VIDEO STATE
// ============================================

export const selectedVideo = signal<VideoResponseDto | null>(null);
export const selectedVideos = signal<VideoResponseDto[]>([]);

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

export const loadVideos = async () => {
  videosLoading.value = true;
  try {
    console.log("[ViralVideosState] Loading videos with filters:", videoFilters.value);
    const response = await fetchViralVideos(videoFilters.value);

    videos.value = response.content || [];
    totalElements.value = response.totalElements || 0;

    console.log("[ViralVideosState] Set videos:", videos.value.length, "items");
  } catch (error) {
    console.error("[ViralVideosState] Failed to load videos:", error);
    toast.error(
      "Failed to load videos: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    videos.value = [];
    totalElements.value = 0;
  } finally {
    videosLoading.value = false;
  }
};

export const loadBatches = async () => {
  try {
    const batchData = await fetchAllBatchesForVideos({ activeFlag: true });
    batches.value = batchData;
  } catch (error) {
    console.error("[ViralVideosState] Failed to load batches:", error);
  }
};

export const deleteSelectedVideo = async () => {
  if (!selectedVideo.value) return false;

  isSubmitting.value = true;
  try {
    await deleteVideoApi(selectedVideo.value.id);
    toast.success("Video deleted successfully!");
    selectedVideo.value = null;
    await loadVideos();
    return true;
  } catch (error) {
    console.error("[ViralVideosState] Failed to delete video:", error);
    toast.error("Failed to delete video");
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

export const toggleSelectedVideoStatus = async () => {
  if (!selectedVideo.value) return false;

  isSubmitting.value = true;
  try {
    await toggleVideoStatusApi(
      selectedVideo.value.id,
      !selectedVideo.value.isActive
    );
    toast.success(
      `Video ${selectedVideo.value.isActive ? "deactivated" : "activated"} successfully!`
    );
    selectedVideo.value = null;
    await loadVideos();
    return true;
  } catch (error) {
    console.error("[ViralVideosState] Failed to toggle video status:", error);
    toast.error("Failed to update video status");
    return false;
  } finally {
    isSubmitting.value = false;
  }
};

export const toggleVideoSelection = (video: VideoResponseDto) => {
  const current = selectedVideos.value;
  const isSelected = current.some((v) => v.id === video.id);

  if (isSelected) {
    selectedVideos.value = current.filter((v) => v.id !== video.id);
  } else {
    selectedVideos.value = [...current, video];
  }
};

export const selectAllVideos = () => {
  selectedVideos.value = [...videos.value];
};

export const clearAllSelections = () => {
  selectedVideos.value = [];
};

export const updateFilters = (newFilters: Partial<VideoFilters>) => {
  videoFilters.value = { ...videoFilters.value, ...newFilters };
};

export const resetVideoState = () => {
  videos.value = [];
  selectedVideo.value = null;
  selectedVideos.value = [];
  searchQuery.value = "";
  videoFilters.value = {
    pageNo: 0,
    pageSize: 20,
    sortBy: "displayOrder",
    sortDir: "ASC",
    active: true,
  };
};
