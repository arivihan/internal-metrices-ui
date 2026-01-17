import { useState, useEffect } from "react";
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

import { UploadVideoDialog } from "./UploadVideoDialog";
import { DuplicateVideoDialog } from "./duplicateVideoDialog";
import {
  fetchViralVideos,
  fetchAllBatchesForVideos,
} from "@/services/viralVideos";
import type {
  VideoResponseDto,
  VideoFilters,
  BatchOption,
} from "@/types/viralVideos";
import {
  VIDEO_TYPES,
  VIDEO_ORIENTATIONS,
  DISPLAY_CONTEXTS,
} from "@/types/viralVideos";

export default function ViralVideosPage() {
  const [videos, setVideos] = useState<VideoResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<VideoResponseDto[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [filters, setFilters] = useState<VideoFilters>({
    pageNo: 0,
    pageSize: 20,
    sortBy: "position",
    sortDir: "ASC",
    active: true,
  });
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewVideo, setPreviewVideo] = useState<VideoResponseDto | null>(
    null
  );

  useEffect(() => {
    loadVideos();
  }, [filters]);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      console.log("[ViralVideosPage] Loading videos with filters:", filters);
      const response = await fetchViralVideos(filters);
      console.log("[ViralVideosPage] Videos response:", response);

      setVideos(response.content || []);
      setTotalElements(response.totalElements || 0);

      console.log(
        "[ViralVideosPage] Set videos:",
        response.content?.length || 0,
        "items"
      );
    } catch (error) {
      console.error("[ViralVideosPage] Failed to load videos:", error);
      toast.error(
        "Failed to load videos: " +
        (error instanceof Error ? error.message : "Unknown error")
      );
      setVideos([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const batchesRes = await fetchAllBatchesForVideos({ activeFlag: true });
      setBatches(batchesRes);
    } catch (error) {
      console.error("[ViralVideosPage] Failed to load batches:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filter locally by video code
    if (query.trim()) {
      const filtered = videos.filter((v) =>
        v.videoCode.toLowerCase().includes(query.toLowerCase())
      );
      setVideos(filtered);
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
      setSelectedVideos((prev) => [...prev, video]);
    } else {
      setSelectedVideos((prev) => prev.filter((v) => v.id !== video.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVideos([...videos]);
    } else {
      setSelectedVideos([]);
    }
  };

  const isVideoSelected = (videoId: string) => {
    return selectedVideos.some((v) => v.id === videoId);
  };

  const isAllSelected =
    videos.length > 0 && selectedVideos.length === videos.length;
  const isIndeterminate =
    selectedVideos.length > 0 && selectedVideos.length < videos.length;

  const handleDuplicateSuccess = () => {
    toast.success("Videos duplicated successfully!");
    setSelectedVideos([]);
    loadVideos();
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

  const getBatchName = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch?.name || `Batch ${batchId}`;
  };

  const handleFilterByBatch = (batchId: string) => {
    if (batchId === "all") {
      setFilters((prev) => {
        const { batchId: _, ...rest } = prev;
        return rest;
      });
    } else {
      setFilters((prev) => ({ ...prev, batchId: Number(batchId), pageNo: 0 }));
    }
  };

  const handleFilterByType = (videoType: string) => {
    if (videoType === "all") {
      setFilters((prev) => {
        const { videoType: _, ...rest } = prev;
        return rest;
      });
    } else {
      setFilters((prev) => ({ ...prev, videoType, pageNo: 0 }));
    }
  };

  const handleFilterByStatus = (active: string) => {
    if (active === "all") {
      setFilters((prev) => {
        const { active: _, ...rest } = prev;
        return rest;
      });
    } else {
      setFilters((prev) => ({ ...prev, active: active === "true", pageNo: 0 }));
    }
  };

  // Stats calculations
  const activeVideos = videos.filter((v) => v.isActive).length;
  const portraitVideos = videos.filter(
    (v) => v.videoOrientation === "PORTRAIT"
  ).length;
  const uniqueBatches = new Set(videos.map((v) => v.batchId)).size;

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
            {selectedVideos.length > 0 && (
              <span className="ml-2 text-rose-600 font-medium">
                • {selectedVideos.length} video
                {selectedVideos.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedVideos.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDuplicateDialog(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate ({selectedVideos.length})
            </Button>
          )}
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-rose-400 hover:bg-rose-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload Videos
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by video code..."
              value={searchQuery}
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
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={String(batch.id)}>
                {batch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Video Type Filter */}
        <Select
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
        </Select>

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
            setFilters({
              pageNo: 0,
              pageSize: 20,
              sortBy: "position",
              sortDir: "ASC",
              active: true,
            });
            setSearchQuery("");
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
                {totalElements}
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
              <TableHead>Position</TableHead>
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
            ) : videos.length === 0 ? (
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
              videos.map((video) => (
                <TableRow key={video.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={isVideoSelected(video.id)}
                      onCheckedChange={(checked) =>
                        handleSelectVideo(video, checked as boolean)
                      }
                      aria-label={`Select video ${video.videoCode}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative group">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.videoCode}
                        className="h-16 w-12 object-cover rounded-md border shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/48x64?text=No+Image";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">
                        {video.videoCode}
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
                      {getVideoTypeDisplay(video.videoType)}
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
                    <div className="text-sm">{getBatchName(video.batchId)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      #{video.position}
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
                          onClick={() => window.open(video.videoUrl, "_blank")}
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedVideos([video]);
                            setShowDuplicateDialog(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
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
            Showing {videos.length} of {totalElements} videos
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
            <span className="text-sm text-muted-foreground">
              Page {(filters.pageNo || 0) + 1} of{" "}
              {Math.ceil(totalElements / (filters.pageSize || 20))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters((prev) => ({ ...prev, pageNo: prev.pageNo! + 1 }))
              }
              disabled={videos.length < filters.pageSize!}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Upload Video Dialog */}
      <UploadVideoDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={handleUploadSuccess}
      />

      {/* Duplicate Video Dialog */}
      <DuplicateVideoDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        selectedVideos={selectedVideos}
        onSuccess={handleDuplicateSuccess}
      />
    </div>
  );
}
