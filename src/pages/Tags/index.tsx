import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Tag,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  Hash,
  Film,
  Calendar,
  Sparkles,
  TrendingUp,
  RefreshCw,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CreateTagDialog } from "./CreateTagDialog";
import { EditTagDialog } from "./EditTagDialog";
import { ViewTagDetailsDialog } from "./ViewTagDetailsDialog";
import {
  fetchTags,
  deleteTag,
} from "@/services/tags";
import type {
  TagResponse,
  TagFilters,
} from "@/types/tags";

export default function TagsPage() {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false);
  const [viewingTagId, setViewingTagId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<TagResponse[]>([]);
  const [selectedTag, setSelectedTag] = useState<TagResponse | null>(null);
  const [filters, setFilters] = useState<TagFilters>({
    pageNo: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTags();
  }, [filters]);

  const loadTags = async () => {
    setLoading(true);
    try {
      console.log("[TagsPage] Loading tags with filters:", filters);
      const response = await fetchTags(filters);
      console.log("[TagsPage] Tags response:", response);

      setTags(response.content || []);
      setTotalElements(response.totalElements || 0);

      console.log(
        "[TagsPage] Set tags:",
        response.content?.length || 0,
        "items"
      );
    } catch (error) {
      console.error("[TagsPage] Failed to load tags:", error);
      toast.error(
        "Failed to load tags: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setTags([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query || undefined, pageNo: 0 }));
  };

  const handleSuccess = () => {
    toast.success("Operation completed successfully!");
    loadTags();
  };

  const handleSelectTag = (tag: TagResponse, checked: boolean) => {
    if (checked) {
      setSelectedTags((prev) => [...prev, tag]);
    } else {
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTags([...tags]);
    } else {
      setSelectedTags([]);
    }
  };

  const isTagSelected = (tagId: number) => {
    return selectedTags.some((t) => t.id === tagId);
  };

  const isAllSelected =
    tags.length > 0 && selectedTags.length === tags.length;
  const isIndeterminate =
    selectedTags.length > 0 && selectedTags.length < tags.length;

  // Handle View Details
  const handleViewDetailsClick = (tag: TagResponse) => {
    setViewingTagId(tag.id);
    setShowViewDetailsDialog(true);
  };

  // Handle Edit Tag
  const handleEditClick = (tag: TagResponse) => {
    setSelectedTag(tag);
    setShowEditDialog(true);
  };

  // Handle Delete Tag
  const handleDeleteClick = (tag: TagResponse) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTag) return;

    setIsSubmitting(true);
    try {
      await deleteTag(selectedTag.id);
      toast.success("Tag deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedTag(null);
      loadTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error("Failed to delete tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortDir: prev.sortBy === sortBy && prev.sortDir === "DESC" ? "ASC" : "DESC",
      pageNo: 0,
    }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Stats calculations
  const totalReels = tags.reduce((sum, tag) => sum + (tag.reelCount || 0), 0);
  const tagsWithReels = tags.filter((t) => t.reelCount > 0).length;
  const avgReelsPerTag = tags.length > 0 ? Math.round(totalReels / tags.length) : 0;

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Tag className="h-8 w-8 text-violet-500" />
            Tags Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize and manage tags for your reels content
            {selectedTags.length > 0 && (
              <span className="ml-2 text-violet-500 font-medium">
                • {selectedTags.length} tag
                {selectedTags.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={loadTags}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-violet-500 hover:bg-violet-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Tag
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tags */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {totalElements}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Total Tags
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <Hash className="h-4 w-4 text-violet-500" />
            </div>
          </div>
        </div>

        {/* Total Reels */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {totalReels}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Total Reels
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
              <Film className="h-4 w-4 text-pink-500" />
            </div>
          </div>
        </div>

        {/* Tags with Reels */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {tagsWithReels}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Active Tags
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Avg Reels Per Tag */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {avgReelsPerTag}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Avg Reels/Tag
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort By */}
        <Select
          value={filters.sortBy || "createdAt"}
          onValueChange={(value) => handleSortChange(value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="slug">Slug</SelectItem>
            <SelectItem value="reelCount">Reel Count</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Direction */}
        <Select
          value={filters.sortDir || "DESC"}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, sortDir: value as "ASC" | "DESC", pageNo: 0 }))
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DESC">Newest First</SelectItem>
            <SelectItem value="ASC">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setFilters({
              pageNo: 0,
              pageSize: 20,
              sortBy: "createdAt",
              sortDir: "DESC",
            });
            setSearchQuery("");
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Tags Table */}
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
                  aria-label="Select all tags"
                />
              </TableHead>
              <TableHead>Tag Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Reels</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[100px] text-center">Actions</TableHead>
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
                    <Skeleton className="h-5 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[50px] mx-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[40px] mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Tag className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No tags found
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start by creating your first tag
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(true)}
                      className="text-violet-500 border-violet-200 hover:bg-violet-50"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Tag
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={isTagSelected(tag.id)}
                      onCheckedChange={(checked) =>
                        handleSelectTag(tag, checked as boolean)
                      }
                      aria-label={`Select tag ${tag.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                        <Hash className="h-4 w-4 text-violet-500" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{tag.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {tag.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {tag.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={tag.reelCount > 0 ? "default" : "secondary"}
                      className={
                        tag.reelCount > 0
                          ? "bg-pink-500 hover:bg-pink-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      <Film className="h-3 w-3 mr-1" />
                      {tag.reelCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(tag.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetailsClick(tag)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(tag)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Tag
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(tag)}
                            className="text-red-600 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Tag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
            Showing {tags.length} of {totalElements} tags
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
              disabled={tags.length < filters.pageSize!}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Tag Dialog */}
      <CreateTagDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSuccess}
      />

      {/* Edit Tag Dialog */}
      <EditTagDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleSuccess}
        tagId={selectedTag?.id || null}
      />

      {/* View Tag Details Dialog */}
      <ViewTagDetailsDialog
        open={showViewDetailsDialog}
        onOpenChange={setShowViewDetailsDialog}
        tagId={viewingTagId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete tag "{selectedTag?.name}"?
              {selectedTag?.reelCount && selectedTag.reelCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: This tag is associated with {selectedTag.reelCount} reel(s).
                </span>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
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
    </div>
  );
}
