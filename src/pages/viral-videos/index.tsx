import { useState, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Copy,
  Play,
  ExternalLink,
  Video,
  Eye,
  Smartphone,
  Monitor,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  History,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { UploadVideoDialog } from "./UploadVideoDialog";
import { BulkUploadVideoDialog } from "./BulkUploadVideoDialog";
import { DuplicateVideoDialog } from "./DuplicateVideoDialog";
import { ViewVideoDetailsDialog } from "./ViewVideoDetailsDialog";
import {
  updateVideo,
  fetchVideoAuditTrail,
  fetchVideosTableAuditTrail,
} from "@/services/viralVideos";
import { AuditTrailPopup } from "@/components/AuditTrailPopup";
import type {
  VideoResponseDto,
  VideoRequest,
} from "@/types/viralVideos";
import {
  VIDEO_TYPES,
  VIDEO_ORIENTATIONS,
  DISPLAY_CONTEXTS,
} from "@/types/viralVideos";

// Import signals
import {
  videos,
  videosLoading,
  totalElements,
  videoFilters,
  searchQuery,
  selectedVideo,
  selectedVideos,
  batches,
  isSubmitting,
  loadVideos,
  loadBatches,
  deleteSelectedVideo,
  toggleSelectedVideoStatus,
  selectAllVideos,
  clearAllSelections,
  updateFilters,
  resetVideoState,
} from "@/signals/viralVideosState";

export default function ViralVideosPage() {
  useSignals();

  // Local UI state (dialog open/close states)
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoResponseDto | null>(null);

  // Edit, Delete, Status Toggle dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<VideoRequest>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // View Details state
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false);
  const [viewingVideoId, setViewingVideoId] = useState<string | null>(null);

  // Audit Trail state (local)
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
  const [currentAuditVideoId, setCurrentAuditVideoId] = useState<string | null>(null);
  const [isTableAudit, setIsTableAudit] = useState(false);

  // Get signal values
  const videosList = videos.value;
  const loading = videosLoading.value;
  const total = totalElements.value;
  const filters = videoFilters.value;
  const search = searchQuery.value;
  const selected = selectedVideo.value;
  const selectedList = selectedVideos.value;
  const batchesList = batches.value;
  const submitting = isSubmitting.value;

  useEffect(() => {
    loadVideos();
  }, [filters]);

  useEffect(() => {
    loadBatches();
  }, []);

  const handleSearch = (query: string) => {
    searchQuery.value = query;
    // Filter locally by video code
    if (query.trim()) {
      const filtered = videosList.filter((v) =>
        v.code.toLowerCase().includes(query.toLowerCase())
      );
      videos.value = filtered;
    } else {
      loadVideos();
    }
  };

  const handleUploadSuccess = () => {
    toast.success("Videos uploaded successfully!");
    loadVideos();
  };

  const handleSelectVideo = (video: VideoResponseDto, checked: boolean) => {
    if (checked) {
      selectedVideos.value = [...selectedList, video];
    } else {
      selectedVideos.value = selectedList.filter((v) => v.id !== video.id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllVideos();
    } else {
      clearAllSelections();
    }
  };

  const isVideoSelected = (videoId: string) => {
    return selectedList.some((v) => v.id === videoId);
  };

  const isAllSelected =
    videosList.length > 0 && selectedList.length === videosList.length;
  const isIndeterminate =
    selectedList.length > 0 && selectedList.length < videosList.length;

  const handleDuplicateSuccess = () => {
    toast.success("Videos duplicated successfully!");
    clearAllSelections();
    loadVideos();
  };

  // Handle Edit Video
  const handleEditClick = (video: VideoResponseDto) => {
    selectedVideo.value = video;
    setEditFormData({
      code: video.code,
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      orientation: video.videoOrientation,
      context: video.displayContext,
      type: video.type,
      displayOrder: video.displayOrder,
      isActive: video.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selected) return;

    isSubmitting.value = true;
    try {
      await updateVideo(selected.id, editFormData);
      toast.success("Video updated successfully!");
      setEditDialogOpen(false);
      selectedVideo.value = null;
      loadVideos();
    } catch (error) {
      console.error("Failed to update video:", error);
      toast.error("Failed to update video");
    } finally {
      isSubmitting.value = false;
    }
  };

  // Handle Delete Video
  const handleDeleteClick = (video: VideoResponseDto) => {
    selectedVideo.value = video;
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteSelectedVideo();
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  // Handle Status Toggle
  const handleStatusClick = (video: VideoResponseDto) => {
    selectedVideo.value = video;
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    const success = await toggleSelectedVideoStatus();
    if (success) {
      setStatusDialogOpen(false);
    }
  };

  // Handle View Details
  const handleViewDetailsClick = (video: VideoResponseDto) => {
    setViewingVideoId(video.id);
    setShowViewDetailsDialog(true);
  };

  // Audit Trail handlers
  const handleRowAuditClick = async (video: VideoResponseDto) => {
    setCurrentAuditVideoId(video.id);
    setIsTableAudit(false);
    setAuditTrailTitle(`Audit Trail - ${video.code}`);
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(video.id, 0, false);
  };

  const handleTableAuditClick = async () => {
    setCurrentAuditVideoId(null);
    setIsTableAudit(true);
    setAuditTrailTitle("Viral Videos Table Audit Trail");
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(null, 0, true);
  };

  const fetchAuditTrailPage = async (
    videoId: string | null,
    pageNo: number,
    tableAudit: boolean,
    pageSizeParam?: number
  ) => {
    const size = pageSizeParam ?? auditTrailPagination.pageSize;
    setAuditTrailLoading(true);
    try {
      let response;
      if (tableAudit) {
        response = await fetchVideosTableAuditTrail(pageNo, size);
      } else if (videoId) {
        response = await fetchVideoAuditTrail(videoId, pageNo, size);
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
      console.error("[ViralVideosPage] Failed to fetch audit trail:", error);
      toast.error("Failed to load audit trail");
      setAuditTrailData([]);
    } finally {
      setAuditTrailLoading(false);
    }
  };

  const handleAuditPageChange = (newPage: number) => {
    fetchAuditTrailPage(currentAuditVideoId, newPage, isTableAudit);
  };

  const handleAuditPageSizeChange = (newPageSize: number) => {
    // Reset to first page when changing page size
    fetchAuditTrailPage(currentAuditVideoId, 0, isTableAudit, newPageSize);
  };

  const getVideoTypeDisplay = (type: string) => {
    return VIDEO_TYPES[type] || type;
  };

  const getOrientationIcon = (orientation: string) => {
    return orientation === "PORTRAIT" ? (
      <Smartphone className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );
  };

  const handleFilterByBatch = (batchId: string) => {
    if (batchId === "all") {
      const { batchId: _, ...rest } = filters;
      videoFilters.value = rest;
    } else {
      updateFilters({ batchId: Number(batchId), pageNo: 0 });
    }
  };

  const handleFilterByType = (videoType: string) => {
    if (videoType === "all") {
      const { videoType: _, ...rest } = filters;
      videoFilters.value = rest;
    } else {
      updateFilters({ videoType, pageNo: 0 });
    }
  };

  const handleFilterByStatus = (active: string) => {
    if (active === "all") {
      const { active: _, ...rest } = filters;
      videoFilters.value = rest;
    } else {
      updateFilters({ active: active === "true", pageNo: 0 });
    }
  };

  // Stats calculations
  const activeVideos = videosList.filter((v) => v.isActive).length;
  const portraitVideos = videosList.filter(
    (v) => v.videoOrientation === "PORTRAIT"
  ).length;
  const uniqueBatches = new Set(
    videosList.flatMap((v) => v.batches?.map((b) => b.batchId) || [])
  ).size;

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Video className="h-8 w-8 text-rose-500" />
            Viral Videos
          </h1>
          <p className="text-muted-foreground">
            Manage and upload viral videos for different batches
            {selectedList.length > 0 && (
              <span className="ml-2 text-rose-600 font-medium">
                • {selectedList.length} video
                {selectedList.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedList.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate ({selectedList.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleTableAuditClick}>
            <History className="mr-2 h-4 w-4" />
            Table Audit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-rose-500 hover:bg-rose-600">
                <Plus className="mr-2 h-4 w-4" />
                Upload Videos
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => setShowUploadDialog(true)}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Single
                <span className="ml-auto text-xs text-muted-foreground">Form</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowBulkUploadDialog(true)}
                className="cursor-pointer"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Bulk Upload
                <span className="ml-auto text-xs text-muted-foreground">Excel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by video code..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Batch Filter */}
        <Select
          value={filters.batchId?.toString() || "all"}
          onValueChange={handleFilterByBatch}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batchesList.map((batch) => (
              <SelectItem key={batch.id} value={String(batch.id)}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Video Type Filter */}
        {/* <Select
          value={filters.videoType || "all"}
          onValueChange={handleFilterByType}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(VIDEO_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}

        {/* Status Filter */}
        <Select
          value={filters.active === undefined ? "all" : String(filters.active)}
          onValueChange={handleFilterByStatus}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            resetVideoState();
            loadVideos();
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Videos */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {total}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Total Videos
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
              <Video className="h-4 w-4 text-rose-400" />
            </div>
          </div>
        </div>

        {/* Active Videos */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {activeVideos}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Active Videos
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Eye className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Portrait Videos */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {portraitVideos}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Portrait Videos
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <Smartphone className="h-4 w-4 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Unique Batches */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {uniqueBatches}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Unique Batches
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
              <Filter className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Videos Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  // @ts-ignore
                  indeterminate={isIndeterminate}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all videos"
                />
              </TableHead>
              <TableHead className="w-[100px]">Thumbnail</TableHead>
              <TableHead>Video Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Orientation</TableHead>
              <TableHead>Display Context</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Status</TableHead>
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
                    <Skeleton className="h-16 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[40px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : videosList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No videos found.
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start by uploading your first viral video
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadDialog(true)}
                      className="text-cyan-500 border-cyan-200 hover:bg-cyan-50"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Video
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              videosList.map((video) => (
                <TableRow key={video.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={isVideoSelected(video.id)}
                      onCheckedChange={(checked) =>
                        handleSelectVideo(video, checked as boolean)
                      }
                      aria-label={`Select video ${video.code}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative group">
                      {!video.thumbnailUrl || failedImages.has(video.id) ? (
                        <div className="h-16 w-12 flex items-center justify-center bg-muted rounded-md border">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.code}
                          loading="lazy"
                          className="h-16 w-12 object-cover rounded-md border shadow-sm"
                          onError={() => {
                            setFailedImages((prev) => new Set(prev).add(video.id));
                          }}
                        />
                      )}
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                        onClick={() => video.url && window.open(video.url, "_blank")}
                      >
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">
                        {video.code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {video.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-rose-50 text-rose-700 border-rose-200"
                    >
                      {getVideoTypeDisplay(video.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getOrientationIcon(video.videoOrientation)}
                      <span className="text-sm">
                        {VIDEO_ORIENTATIONS[video.videoOrientation] ||
                          video.videoOrientation}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {DISPLAY_CONTEXTS[video.displayContext] ||
                        video.displayContext}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {video.batches?.length > 0
                        ? video.batches.map(b => b.batchName).join(", ")
                        : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      #{video.displayOrder}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={video.isActive ? "default" : "secondary"}
                      className={
                        video.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {video.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(video.url, "_blank")}
                          className="cursor-pointer"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Play Video
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(video.thumbnailUrl, "_blank")
                          }
                          className="cursor-pointer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Thumbnail
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewDetailsClick(video)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleEditClick(video)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusClick(video)}
                          className="cursor-pointer"
                        >
                          {video.isActive ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              Inactive
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              Active
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            selectedVideos.value = [video];
                            setShowDuplicateDialog(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(video)}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRowAuditClick(video)}
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
      {total > filters.pageSize! && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {videosList.length} of {total} videos
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateFilters({ pageNo: Math.max(0, filters.pageNo! - 1) })
              }
              disabled={filters.pageNo === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {(filters.pageNo || 0) + 1} of{" "}
              {Math.ceil(total / (filters.pageSize || 20))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateFilters({ pageNo: filters.pageNo! + 1 })
              }
              disabled={videosList.length < filters.pageSize!}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Single Upload Video Dialog */}
      <UploadVideoDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={handleUploadSuccess}
      />

      {/* Bulk Upload Video Dialog (Excel) */}
      <BulkUploadVideoDialog
        open={showBulkUploadDialog}
        onOpenChange={setShowBulkUploadDialog}
        onSuccess={handleUploadSuccess}
      />

      {/* Duplicate Video Dialog */}
      <DuplicateVideoDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        selectedVideos={selectedList}
        onSuccess={handleDuplicateSuccess}
      />

      {/* View Video Details Dialog */}
      <ViewVideoDetailsDialog
        open={showViewDetailsDialog}
        onOpenChange={setShowViewDetailsDialog}
        videoId={viewingVideoId}
      />

      {/* Edit Video Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
            <DialogDescription>
              Update video details for {selected?.code}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Video Code</Label>
              <Input
                id="code"
                value={editFormData.code || ""}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="Enter video code"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">Video URL</Label>
              <Input
                id="url"
                value={editFormData.url || ""}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="Enter video URL"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                value={editFormData.thumbnailUrl || ""}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    thumbnailUrl: e.target.value,
                  }))
                }
                placeholder="Enter thumbnail URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={editFormData.orientation || ""}
                  onValueChange={(val) =>
                    setEditFormData((prev) => ({ ...prev, orientation: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PORTRAIT">Portrait</SelectItem>
                    <SelectItem value="LANDSCAPE">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="context">Display Context</Label>
                <Select
                  value={editFormData.context || ""}
                  onValueChange={(val) =>
                    setEditFormData((prev) => ({ ...prev, context: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISPLAY_CONTEXTS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Video Type</Label>
                <Select
                  value={editFormData.type || ""}
                  onValueChange={(val) =>
                    setEditFormData((prev) => ({ ...prev, type: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VIDEO_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={editFormData.displayOrder ?? ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      displayOrder: Number(e.target.value),
                    }))
                  }
                  placeholder="Enter display order"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete video "{selected?.code}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selected?.isActive ? "Deactivate" : "Activate"} Video
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selected?.isActive ? "deactivate" : "activate"}{" "}
              video "{selected?.code}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : selected?.isActive ? (
                "Deactivate"
              ) : (
                "Activate"
              )}
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
          setCurrentAuditVideoId(null);
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
