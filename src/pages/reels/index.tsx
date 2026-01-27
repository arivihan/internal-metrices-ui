import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Upload,
  MoreHorizontal,
  Pencil,
  ExternalLink,
  History,
  ChevronDown,
  Loader2,
  RotateCcw,
  Check,
  Trash2,
  Eye,
  ThumbsUp,
  Play,
  Filter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AuditTrailPopup } from "@/components/AuditTrailPopup";

import {
  fetchReels,
  deleteReels,
  updateReelStatus,
  fetchReelAuditTrail,
  fetchReelsTableAuditTrail,
  fetchExamsPaginated,
  fetchGradesPaginated,
  fetchStreamsPaginated,
  fetchTags,
} from "@/services/reels";
import type {
  ReelResponseDto,
  ReelFilters,
  ExamOption,
  GradeOption,
  StreamOption,
  TagResponseDto,
} from "@/types/reels";

import { AddReelDialog } from "./AddReelDialog";
import { EditReelDialog } from "./EditReelDialog";
import { BulkUploadReelsDialog } from "./BulkUploadReelsDialog";

const DIFFICULTY_LEVELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const LANGUAGES = {
  ENGLISH: "English",
  HINDI: "Hindi",
};

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedReels, setSelectedReels] = useState<ReelResponseDto[]>([]);
  const [editingReel, setEditingReel] = useState<ReelResponseDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reelsToDelete, setReelsToDelete] = useState<ReelResponseDto[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

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
  const [currentAuditReelId, setCurrentAuditReelId] = useState<number | null>(null);
  const [isTableAudit, setIsTableAudit] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<ReelFilters>({
    pageNo: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Exam dropdown state
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [examPagination, setExamPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [selectedExam, setSelectedExam] = useState<ExamOption | null>(null);
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);

  // Grade dropdown state
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradeSearchQuery, setGradeSearchQuery] = useState("");
  const [gradePagination, setGradePagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [selectedGrade, setSelectedGrade] = useState<GradeOption | null>(null);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);

  // Stream dropdown state
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamSearchQuery, setStreamSearchQuery] = useState("");
  const [streamPagination, setStreamPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [selectedStream, setSelectedStream] = useState<StreamOption | null>(null);
  const [streamDropdownOpen, setStreamDropdownOpen] = useState(false);

  // Tags dropdown state
  const [tags, setTags] = useState<TagResponseDto[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [tagPagination, setTagPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });
  const [selectedTags, setSelectedTags] = useState<TagResponseDto[]>([]);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);

  useEffect(() => {
    loadReels();
  }, [filters]);

  const loadReels = async () => {
    setLoading(true);
    try {
      console.log("[ReelsPage] Loading reels with filters:", filters);
      const response = await fetchReels(filters);
      console.log("[ReelsPage] Reels response:", response);

      setReels(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error("[ReelsPage] Failed to load reels:", error);
      toast.error(
        "Failed to load reels: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setReels([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  // Exam loading functions
  const loadExams = async (pageNo: number = 0, search?: string) => {
    setExamsLoading(true);
    try {
      const response = await fetchExamsPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        active: true,
        sortBy: "displayOrder",
        sortDir: "ASC",
      });

      if (pageNo === 0) {
        setExams(response.content || []);
      } else {
        setExams((prev) => [...prev, ...(response.content || [])]);
      }

      setExamPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("[ReelsPage] Failed to load exams:", error);
      toast.error("Failed to load exams");
    } finally {
      setExamsLoading(false);
    }
  };

  // Grade loading functions
  const loadGrades = async (pageNo: number = 0, search?: string) => {
    setGradesLoading(true);
    try {
      const response = await fetchGradesPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        active: true,
        sortBy: "displayOrder",
        sortDir: "ASC",
      });

      if (pageNo === 0) {
        setGrades(response.content || []);
      } else {
        setGrades((prev) => [...prev, ...(response.content || [])]);
      }

      setGradePagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("[ReelsPage] Failed to load grades:", error);
      toast.error("Failed to load grades");
    } finally {
      setGradesLoading(false);
    }
  };

  // Stream loading functions
  const loadStreams = async (pageNo: number = 0, search?: string) => {
    setStreamsLoading(true);
    try {
      const response = await fetchStreamsPaginated({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        active: true,
        sortBy: "displayOrder",
        sortDir: "ASC",
      });

      if (pageNo === 0) {
        setStreams(response.content || []);
      } else {
        setStreams((prev) => [...prev, ...(response.content || [])]);
      }

      setStreamPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("[ReelsPage] Failed to load streams:", error);
      toast.error("Failed to load streams");
    } finally {
      setStreamsLoading(false);
    }
  };

  // Tags loading functions
  const loadTags = async (pageNo: number = 0, search?: string) => {
    setTagsLoading(true);
    try {
      const response = await fetchTags({
        pageNo,
        pageSize: 10,
        search: search || undefined,
        sortBy: "createdAt",
        sortDir: "ASC",
      });

      if (pageNo === 0) {
        setTags(response.content || []);
      } else {
        setTags((prev) => [...prev, ...(response.content || [])]);
      }

      setTagPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 1,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? 10,
      });
    } catch (error) {
      console.error("[ReelsPage] Failed to load tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setTagsLoading(false);
    }
  };

  // Load dropdowns when opened
  useEffect(() => {
    if (examDropdownOpen && exams.length === 0) {
      loadExams(0);
    }
  }, [examDropdownOpen]);

  useEffect(() => {
    if (gradeDropdownOpen && grades.length === 0) {
      loadGrades(0);
    }
  }, [gradeDropdownOpen]);

  useEffect(() => {
    if (streamDropdownOpen && streams.length === 0) {
      loadStreams(0);
    }
  }, [streamDropdownOpen]);

  useEffect(() => {
    if (tagsDropdownOpen && tags.length === 0) {
      loadTags(0);
    }
  }, [tagsDropdownOpen]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({
      ...prev,
      search: query || undefined,
      pageNo: 0,
    }));
  };

  const handleExamSearch = (query: string) => {
    setExamSearchQuery(query);
    loadExams(0, query);
  };

  const handleExamSelect = (exam: ExamOption | null) => {
    setSelectedExam(exam);
    setFilters((prev) => ({
      ...prev,
      examId: exam?.id || undefined,
      pageNo: 0,
    }));
    setExamDropdownOpen(false);
  };

  const handleLoadMoreExams = () => {
    if (examPagination.currentPage < examPagination.totalPages - 1) {
      loadExams(examPagination.currentPage + 1, examSearchQuery);
    }
  };

  const handleGradeSearch = (query: string) => {
    setGradeSearchQuery(query);
    loadGrades(0, query);
  };

  const handleGradeSelect = (grade: GradeOption | null) => {
    setSelectedGrade(grade);
    setFilters((prev) => ({
      ...prev,
      gradeId: grade?.id || undefined,
      pageNo: 0,
    }));
    setGradeDropdownOpen(false);
  };

  const handleLoadMoreGrades = () => {
    if (gradePagination.currentPage < gradePagination.totalPages - 1) {
      loadGrades(gradePagination.currentPage + 1, gradeSearchQuery);
    }
  };

  const handleStreamSearch = (query: string) => {
    setStreamSearchQuery(query);
    loadStreams(0, query);
  };

  const handleStreamSelect = (stream: StreamOption | null) => {
    setSelectedStream(stream);
    setFilters((prev) => ({
      ...prev,
      streamId: stream?.id || undefined,
      pageNo: 0,
    }));
    setStreamDropdownOpen(false);
  };

  const handleLoadMoreStreams = () => {
    if (streamPagination.currentPage < streamPagination.totalPages - 1) {
      loadStreams(streamPagination.currentPage + 1, streamSearchQuery);
    }
  };

  const handleTagSearch = (query: string) => {
    setTagSearchQuery(query);
    loadTags(0, query);
  };

  const handleTagToggle = (tag: TagResponseDto) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.id === tag.id);
      let newTags;
      if (exists) {
        newTags = prev.filter((t) => t.id !== tag.id);
      } else {
        newTags = [...prev, tag];
      }

      // Update filters
      setFilters((f) => ({
        ...f,
        tagIds: newTags.length > 0 ? newTags.map((t) => t.id) : undefined,
        pageNo: 0,
      }));

      return newTags;
    });
  };

  const handleLoadMoreTags = () => {
    if (tagPagination.currentPage < tagPagination.totalPages - 1) {
      loadTags(tagPagination.currentPage + 1, tagSearchQuery);
    }
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: sortBy as ReelFilters["sortBy"],
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
      isActive: status === "all" ? undefined : status === "active",
      pageNo: 0,
    }));
  };

  const handleGlobalChange = (global: string) => {
    setFilters((prev) => ({
      ...prev,
      isGlobal: global === "all" ? undefined : global === "global",
      pageNo: 0,
    }));
  };

  const handleLanguageChange = (language: string) => {
    setFilters((prev) => ({
      ...prev,
      language: language === "all" ? undefined : (language as "ENGLISH" | "HINDI"),
      pageNo: 0,
    }));
  };

  const handleDifficultyChange = (difficulty: string) => {
    setFilters((prev) => ({
      ...prev,
      difficultyLevel:
        difficulty === "all"
          ? undefined
          : (difficulty as "BEGINNER" | "INTERMEDIATE" | "ADVANCED"),
      pageNo: 0,
    }));
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedExam(null);
    setSelectedGrade(null);
    setSelectedStream(null);
    setSelectedTags([]);
    setFilters({
      pageNo: 0,
      pageSize: 20,
      sortBy: "createdAt",
      sortDir: "DESC",
    });
  };

  const handleSelectReel = (reel: ReelResponseDto, checked: boolean) => {
    if (checked) {
      setSelectedReels((prev) => [...prev, reel]);
    } else {
      setSelectedReels((prev) => prev.filter((r) => r.id !== reel.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReels([...reels]);
    } else {
      setSelectedReels([]);
    }
  };

  const isReelSelected = (reelId: number) => {
    return selectedReels.some((r) => r.id === reelId);
  };

  const isAllSelected = reels.length > 0 && selectedReels.length === reels.length;
  const isIndeterminate = selectedReels.length > 0 && selectedReels.length < reels.length;

  const handleEditClick = (reel: ReelResponseDto) => {
    setEditingReel(reel);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (reel: ReelResponseDto) => {
    setReelsToDelete([reel]);
    setDeleteDialogOpen(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedReels.length > 0) {
      setReelsToDelete(selectedReels);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (reelsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      await deleteReels(reelsToDelete.map((r) => r.id));
      toast.success(
        `${reelsToDelete.length} reel${reelsToDelete.length > 1 ? "s" : ""} deleted successfully!`
      );
      setDeleteDialogOpen(false);
      setReelsToDelete([]);
      setSelectedReels([]);
      loadReels();
    } catch (error) {
      console.error("[ReelsPage] Failed to delete reels:", error);
      toast.error(
        "Failed to delete reels: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (reel: ReelResponseDto) => {
    try {
      await updateReelStatus(reel.id, !reel.isActive);
      toast.success(`Reel ${reel.isActive ? "deactivated" : "activated"} successfully!`);
      loadReels();
    } catch (error) {
      console.error("[ReelsPage] Failed to update status:", error);
      toast.error("Failed to update reel status");
    }
  };

  // Audit Trail handlers
  const handleRowAuditClick = async (reel: ReelResponseDto) => {
    setCurrentAuditReelId(reel.id);
    setIsTableAudit(false);
    setAuditTrailTitle(`Audit Trail - ${reel.title}`);
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(reel.id, 0, false);
  };

  const handleTableAuditClick = async () => {
    setCurrentAuditReelId(null);
    setIsTableAudit(true);
    setAuditTrailTitle("Reels Table Audit Trail");
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(null, 0, true);
  };

  const fetchAuditTrailPage = async (
    reelId: number | null,
    pageNo: number,
    tableAudit: boolean,
    pageSizeParam?: number
  ) => {
    const size = pageSizeParam ?? auditTrailPagination.pageSize;
    setAuditTrailLoading(true);
    try {
      let response;
      if (tableAudit) {
        response = await fetchReelsTableAuditTrail(pageNo, size);
      } else if (reelId) {
        response = await fetchReelAuditTrail(reelId, pageNo, size);
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
      console.error("[ReelsPage] Failed to fetch audit trail:", error);
      toast.error("Failed to load audit trail");
      setAuditTrailData([]);
    } finally {
      setAuditTrailLoading(false);
    }
  };

  const handleAuditPageChange = (newPage: number) => {
    fetchAuditTrailPage(currentAuditReelId, newPage, isTableAudit);
  };

  const handleAuditPageSizeChange = (newPageSize: number) => {
    fetchAuditTrailPage(currentAuditReelId, 0, isTableAudit, newPageSize);
  };

  const handleCreateSuccess = () => {
    toast.success("Reel created successfully!");
    loadReels();
  };

  const handleEditSuccess = () => {
    toast.success("Reel updated successfully!");
    loadReels();
  };

  const handleBulkUploadSuccess = () => {
    toast.success("Reels uploaded successfully!");
    loadReels();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reels</h1>
          <p className="text-muted-foreground">
            Manage and upload reels for the app
            {selectedReels.length > 0 && (
              <span className="ml-2 text-cyan-600">
                • {selectedReels.length} reel{selectedReels.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedReels.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkDeleteClick}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedReels.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleTableAuditClick}>
            <History className="mr-2 h-4 w-4" />
            Table Audit
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Reel
          </Button>
        </div>
      </div>

      {/* Filters Row 1: Search, Status, Sort By, Sort Direction, More Filters, Reset */}
      <div className="flex items-center gap-3">
        {/* Search Field */}
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title, description..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.isActive === undefined ? "all" : filters.isActive ? "active" : "inactive"}
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

        {/* Sort By */}
        <Select value={filters.sortBy || "createdAt"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-28 shrink-0">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="viewCount">Views</SelectItem>
            <SelectItem value="likeCount">Likes</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Direction */}
        <Select
          value={filters.sortDir || "DESC"}
          onValueChange={(value) => handleSortDirChange(value as "ASC" | "DESC")}
        >
          <SelectTrigger className="w-28 shrink-0">
            <SelectValue placeholder="Sort Dir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ASC">Ascending</SelectItem>
            <SelectItem value="DESC">Descending</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters Button */}
        <Button
          variant="outline"
          onClick={() => setMoreFiltersOpen(true)}
          className="shrink-0"
        >
          <Filter className="mr-2 h-4 w-4" />
          More Filters
          {(filters.isGlobal !== undefined || filters.language || filters.difficultyLevel || selectedTags.length > 0) && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {[
                filters.isGlobal !== undefined ? 1 : 0,
                filters.language ? 1 : 0,
                filters.difficultyLevel ? 1 : 0,
                selectedTags.length > 0 ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </Button>

        {/* Reset Filters */}
        <Button variant="outline" size="icon" onClick={handleResetFilters} title="Reset Filters" className="shrink-0">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters Row 2: Exam, Grade, Stream, Tags */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
        <span className="text-sm font-medium text-muted-foreground shrink-0">Targeting:</span>

        {/* Exam Dropdown */}
        <Popover open={examDropdownOpen} onOpenChange={setExamDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-40 justify-between shrink-0">
              <span className="truncate">{selectedExam ? selectedExam.name : "Select Exam..."}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Search exams..."
                value={examSearchQuery}
                onChange={(e) => handleExamSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              <div
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                onClick={() => handleExamSelect(null)}
              >
                <Check className={`mr-2 h-4 w-4 ${!selectedExam ? "opacity-100" : "opacity-0"}`} />
                All Exams
              </div>
              {examsLoading && exams.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading...</span>
                </div>
              ) : exams.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No exams found.</div>
              ) : (
                <>
                  {exams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => handleExamSelect(exam)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedExam?.id === exam.id ? "opacity-100" : "opacity-0"}`}
                      />
                      <span className="truncate">{exam.name}</span>
                    </div>
                  ))}
                  {examPagination.currentPage < examPagination.totalPages - 1 && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={handleLoadMoreExams} disabled={examsLoading}>
                        {examsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Grade Dropdown */}
        <Popover open={gradeDropdownOpen} onOpenChange={setGradeDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-40 justify-between shrink-0">
              <span className="truncate">{selectedGrade ? selectedGrade.name : "Select Grade..."}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Search grades..."
                value={gradeSearchQuery}
                onChange={(e) => handleGradeSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              <div
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                onClick={() => handleGradeSelect(null)}
              >
                <Check className={`mr-2 h-4 w-4 ${!selectedGrade ? "opacity-100" : "opacity-0"}`} />
                All Grades
              </div>
              {gradesLoading && grades.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading...</span>
                </div>
              ) : grades.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No grades found.</div>
              ) : (
                <>
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => handleGradeSelect(grade)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedGrade?.id === grade.id ? "opacity-100" : "opacity-0"}`}
                      />
                      <span className="truncate">{grade.name}</span>
                    </div>
                  ))}
                  {gradePagination.currentPage < gradePagination.totalPages - 1 && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={handleLoadMoreGrades} disabled={gradesLoading}>
                        {gradesLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Stream Dropdown */}
        <Popover open={streamDropdownOpen} onOpenChange={setStreamDropdownOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-40 justify-between shrink-0">
              <span className="truncate">{selectedStream ? selectedStream.name : "Select Stream..."}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Search streams..."
                value={streamSearchQuery}
                onChange={(e) => handleStreamSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              <div
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                onClick={() => handleStreamSelect(null)}
              >
                <Check className={`mr-2 h-4 w-4 ${!selectedStream ? "opacity-100" : "opacity-0"}`} />
                All Streams
              </div>
              {streamsLoading && streams.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading...</span>
                </div>
              ) : streams.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No streams found.</div>
              ) : (
                <>
                  {streams.map((stream) => (
                    <div
                      key={stream.id}
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                      onClick={() => handleStreamSelect(stream)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${selectedStream?.id === stream.id ? "opacity-100" : "opacity-0"}`}
                      />
                      <span className="truncate">{stream.name}</span>
                    </div>
                  ))}
                  {streamPagination.currentPage < streamPagination.totalPages - 1 && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={handleLoadMoreStreams} disabled={streamsLoading}>
                        {streamsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{totalElements}</div>
          <p className="text-xs text-muted-foreground">Total Reels</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{reels.filter((r) => r.isActive).length}</div>
          <p className="text-xs text-muted-foreground">Active Reels</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{reels.filter((r) => r.isGlobal).length}</div>
          <p className="text-xs text-muted-foreground">Global Reels</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {formatNumber(reels.reduce((sum, r) => sum + (r.stats?.totalViews || 0), 0))}
          </div>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </div>
      </div>

      {/* Reels Table */}
      <div className="rounded-md border flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all reels"
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Likes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[40px]" /></TableCell>
                </TableRow>
              ))
            ) : reels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-muted-foreground">No reels found.</p>
                    <Button variant="link" onClick={() => setShowAddDialog(true)} className="mt-2">
                      Create your first reel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reels.map((reel) => (
                <TableRow key={reel.id}>
                  <TableCell>
                    <Checkbox
                      checked={isReelSelected(reel.id)}
                      onCheckedChange={(checked) => handleSelectReel(reel, checked as boolean)}
                      aria-label={`Select reel ${reel.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {reel.thumbnailUrl && (
                        <div className="relative w-16 h-10 rounded overflow-hidden bg-muted shrink-0">
                          <img
                            src={reel.thumbnailUrl}
                            alt={reel.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="font-medium line-clamp-1">{reel.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {reel.tags?.map((t) => t.tagName).join(", ") || "No tags"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(reel.durationSeconds)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {DIFFICULTY_LEVELS[reel.difficultyLevel] || reel.difficultyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>{LANGUAGES[reel.language] || reel.language}</TableCell>
                  <TableCell>
                    <Badge variant={reel.isGlobal ? "default" : "secondary"}>
                      {reel.isGlobal ? "Global" : "Targeted"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={reel.isActive ? "default" : "secondary"}
                      className={reel.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {reel.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {formatNumber(reel.stats?.totalViews || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                      {formatNumber(reel.stats?.totalLikes || 0)}
                    </div>
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
                          onClick={() => window.open(reel.videoUrl, "_blank")}
                          className="cursor-pointer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Video
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(reel)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusToggle(reel)} className="cursor-pointer">
                          {reel.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 cursor-pointer"
                          onClick={() => handleDeleteClick(reel)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRowAuditClick(reel)} className="cursor-pointer">
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
            Showing {reels.length} of {totalElements} reels
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, pageNo: Math.max(0, prev.pageNo! - 1) }))}
              disabled={filters.pageNo === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters((prev) => ({ ...prev, pageNo: prev.pageNo! + 1 }))}
              disabled={reels.length < filters.pageSize!}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddReelDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleCreateSuccess}
      />

      <EditReelDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        reel={editingReel}
        onSuccess={handleEditSuccess}
      />

      <BulkUploadReelsDialog
        open={showBulkUploadDialog}
        onOpenChange={setShowBulkUploadDialog}
        onSuccess={handleBulkUploadSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {reelsToDelete.length} reel
              {reelsToDelete.length > 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* More Filters Dialog */}
      <Dialog open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>More Filters</DialogTitle>
            <DialogDescription>
              Apply additional filters to narrow down your search.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Global Filter */}
            <div className="grid gap-2">
              <Label>Scope</Label>
              <Select
                value={filters.isGlobal === undefined ? "all" : filters.isGlobal ? "global" : "targeted"}
                onValueChange={handleGlobalChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scope</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="targeted">Targeted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language Filter */}
            <div className="grid gap-2">
              <Label>Language</Label>
              <Select
                value={filters.language || "all"}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="ENGLISH">English</SelectItem>
                  <SelectItem value="HINDI">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="grid gap-2">
              <Label>Difficulty Level</Label>
              <Select
                value={filters.difficultyLevel || "all"}
                onValueChange={handleDifficultyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags Multi-Select */}
            <div className="grid gap-2">
              <Label>Tags</Label>
              <Popover open={tagsDropdownOpen} onOpenChange={setTagsDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    <span className="truncate">
                      {selectedTags.length > 0 ? `${selectedTags.length} tag(s) selected` : "Select Tags..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search tags..."
                      value={tagSearchQuery}
                      onChange={(e) => handleTagSearch(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="p-2 border-b flex flex-wrap gap-1">
                      {selectedTags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                          <button
                            className="ml-1 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagToggle(tag);
                            }}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="max-h-60 overflow-y-auto scrollbar-hide">
                    {tagsLoading && tags.length === 0 ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-sm">Loading...</span>
                      </div>
                    ) : tags.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">No tags found.</div>
                    ) : (
                      <>
                        {tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                            onClick={() => handleTagToggle(tag)}
                          >
                            <Checkbox
                              checked={selectedTags.some((t) => t.id === tag.id)}
                              className="mr-2"
                            />
                            <span className="truncate flex-1">{tag.name}</span>
                            <span className="text-xs text-muted-foreground">({tag.reelCount})</span>
                          </div>
                        ))}
                        {tagPagination.currentPage < tagPagination.totalPages - 1 && (
                          <div className="p-2 border-t">
                            <Button variant="ghost" size="sm" className="w-full" onClick={handleLoadMoreTags} disabled={tagsLoading}>
                              {tagsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Load More
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMoreFiltersOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Popup */}
      <AuditTrailPopup
        open={auditTrailOpen}
        onClose={() => {
          setAuditTrailOpen(false);
          setAuditTrailData([]);
          setCurrentAuditReelId(null);
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
