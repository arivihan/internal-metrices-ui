import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Images,
  Eye,
  EyeOff,
  Image,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  History,
  GitBranch,
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

import { CreateCarouselDialog } from "./CreateCarouselDialog";
import { EditCarouselDialog } from "./EditCarouselDialog";
import { CopyCarouselDialog } from "./CopyCarouselDialog";
import { ViewCarouselDetailsDialog } from "./ViewCarouselDetailsDialog";
import { AuditTrailPopup } from "@/components/AuditTrailPopup";
import {
  fetchCarousels,
  fetchAllBatchesForCarousels,
  deleteCarousel,
  toggleCarouselStatus,
  fetchCarouselAuditTrail,
  fetchCarouselsTableAuditTrail,
} from "@/services/carousels";
import type {
  CarouselListResponse,
  CarouselFilters,
  BatchOption,
} from "@/types/carousels";
import { VISIBILITY_TYPES } from "@/types/carousels";

export default function AppCarouselsPage() {
  const [carousels, setCarousels] = useState<CarouselListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false);
  const [viewingCarouselId, setViewingCarouselId] = useState<number | null>(null);
  const [selectedCarousels, setSelectedCarousels] = useState<CarouselListResponse[]>([]);
  const [selectedCarousel, setSelectedCarousel] = useState<CarouselListResponse | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [filters, setFilters] = useState<CarouselFilters>({
    pageNo: 0,
    pageSize: 20,
    sortBy: "createdAt",
    sortDir: "DESC",
  });
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete and Status Toggle states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [currentAuditCarouselId, setCurrentAuditCarouselId] = useState<number | null>(null);
  const [isTableAudit, setIsTableAudit] = useState(false);

  useEffect(() => {
    loadCarousels();
  }, [filters]);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadCarousels = async () => {
    setLoading(true);
    try {
      console.log("[AppCarouselsPage] Loading carousels with filters:", filters);
      const response = await fetchCarousels(filters);
      console.log("[AppCarouselsPage] Carousels response:", response);

      setCarousels(response.content || []);
      setTotalElements(response.totalElements || 0);

      console.log(
        "[AppCarouselsPage] Set carousels:",
        response.content?.length || 0,
        "items"
      );
    } catch (error) {
      console.error("[AppCarouselsPage] Failed to load carousels:", error);
      toast.error(
        "Failed to load carousels: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setCarousels([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const batchesRes = await fetchAllBatchesForCarousels({ activeFlag: true });
      setBatches(batchesRes);
    } catch (error) {
      console.error("[AppCarouselsPage] Failed to load batches:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query || undefined, pageNo: 0 }));
  };

  const handleSuccess = () => {
    toast.success("Operation completed successfully!");
    loadCarousels();
  };

  const handleSelectCarousel = (carousel: CarouselListResponse, checked: boolean) => {
    if (checked) {
      setSelectedCarousels((prev) => [...prev, carousel]);
    } else {
      setSelectedCarousels((prev) => prev.filter((c) => c.id !== carousel.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCarousels([...carousels]);
    } else {
      setSelectedCarousels([]);
    }
  };

  const isCarouselSelected = (carouselId: number) => {
    return selectedCarousels.some((c) => c.id === carouselId);
  };

  const isAllSelected =
    carousels.length > 0 && selectedCarousels.length === carousels.length;
  const isIndeterminate =
    selectedCarousels.length > 0 && selectedCarousels.length < carousels.length;

  // Handle View Details
  const handleViewDetailsClick = (carousel: CarouselListResponse) => {
    setViewingCarouselId(carousel.id);
    setShowViewDetailsDialog(true);
  };

  // Handle Edit Carousel
  const handleEditClick = (carousel: CarouselListResponse) => {
    setSelectedCarousel(carousel);
    setShowEditDialog(true);
  };

  // Handle Map Carousel to Batch
  const handleCopyClick = (carousel: CarouselListResponse) => {
    setSelectedCarousels([carousel]);
    setShowCopyDialog(true);
  };

  // Handle Delete Carousel
  const handleDeleteClick = (carousel: CarouselListResponse) => {
    setSelectedCarousel(carousel);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCarousel) return;

    setIsSubmitting(true);
    try {
      await deleteCarousel(selectedCarousel.id);
      toast.success("Carousel deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedCarousel(null);
      loadCarousels();
    } catch (error) {
      console.error("Failed to delete carousel:", error);
      toast.error("Failed to delete carousel");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle
  const handleStatusClick = (carousel: CarouselListResponse) => {
    setSelectedCarousel(carousel);
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedCarousel) return;

    setIsSubmitting(true);
    try {
      await toggleCarouselStatus(selectedCarousel.id, !selectedCarousel.isActive);
      toast.success(
        `Carousel ${selectedCarousel.isActive ? "deactivated" : "activated"} successfully!`
      );
      setStatusDialogOpen(false);
      setSelectedCarousel(null);
      loadCarousels();
    } catch (error) {
      console.error("Failed to toggle carousel status:", error);
      toast.error("Failed to update carousel status");
    } finally {
      setIsSubmitting(false);
    }
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

  const handleFilterByScreenType = (screenType: string) => {
    if (screenType === "all") {
      setFilters((prev) => {
        const { screenType: _, ...rest } = prev;
        return rest;
      });
    } else {
      setFilters((prev) => ({ ...prev, screenType, pageNo: 0 }));
    }
  };

  // Audit Trail handlers
  const handleRowAuditClick = async (carousel: CarouselListResponse) => {
    setCurrentAuditCarouselId(carousel.id);
    setIsTableAudit(false);
    setAuditTrailTitle(`Audit Trail - ${carousel.carouselCode}`);
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(carousel.id, 0, false);
  };

  const handleTableAuditClick = async () => {
    setCurrentAuditCarouselId(null);
    setIsTableAudit(true);
    setAuditTrailTitle("App Carousels Table Audit Trail");
    setAuditTrailOpen(true);
    await fetchAuditTrailPage(null, 0, true);
  };

  const fetchAuditTrailPage = async (
    carouselId: number | null,
    pageNo: number,
    tableAudit: boolean,
    pageSizeParam?: number
  ) => {
    const size = pageSizeParam ?? auditTrailPagination.pageSize;
    setAuditTrailLoading(true);
    try {
      let response;
      if (tableAudit) {
        response = await fetchCarouselsTableAuditTrail(pageNo, size);
      } else if (carouselId) {
        response = await fetchCarouselAuditTrail(carouselId, pageNo, size);
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
      console.error("[AppCarouselsPage] Failed to fetch audit trail:", error);
      toast.error("Failed to load audit trail");
      setAuditTrailData([]);
    } finally {
      setAuditTrailLoading(false);
    }
  };

  const handleAuditPageChange = (newPage: number) => {
    fetchAuditTrailPage(currentAuditCarouselId, newPage, isTableAudit);
  };

  const handleAuditPageSizeChange = (newPageSize: number) => {
    fetchAuditTrailPage(currentAuditCarouselId, 0, isTableAudit, newPageSize);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Stats calculations
  const activeCarousels = carousels.filter((c) => c.isActive).length;
  const allVisibilityCarousels = carousels.filter((c) => c.visibilityType === "ALL").length;

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Images className="h-8 w-8 text-purple-500" />
            App Carousels
          </h1>
          <p className="text-muted-foreground">
            Manage app carousels for different batches
            {selectedCarousels.length > 0 && (
              <span className="ml-2 text-purple-600 font-medium">
                • {selectedCarousels.length} carousel
                {selectedCarousels.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCarousels.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowCopyDialog(true)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <GitBranch className="mr-2 h-4 w-4" />
              Map ({selectedCarousels.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleTableAuditClick}>
            <History className="mr-2 h-4 w-4" />
            Table Audit
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Carousel
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by carousel code..."
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

        {/* Screen Type Filter */}
        <Select
          value={filters.screenType || "all"}
          onValueChange={handleFilterByScreenType}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Screen Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Screens</SelectItem>
            <SelectItem value="HOME">Home</SelectItem>
            <SelectItem value="DASHBOARD">Dashboard</SelectItem>
            <SelectItem value="PROFILE">Profile</SelectItem>
            <SelectItem value="COURSES">Courses</SelectItem>
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
              sortBy: "createdAt",
              sortDir: "DESC",
            });
            setSearchQuery("");
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Carousels */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {totalElements}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Total Carousels
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
              <Images className="h-4 w-4 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Active Carousels */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {activeCarousels}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Active Carousels
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Eye className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* All Visibility Carousels */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {allVisibilityCarousels}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                All Visibility
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <Image className="h-4 w-4 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Inactive Carousels */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {carousels.length - activeCarousels}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Inactive Carousels
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-500/10">
              <EyeOff className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Carousels Table */}
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
                  aria-label="Select all carousels"
                />
              </TableHead>
              <TableHead className="w-[80px]">Preview</TableHead>
              <TableHead>Carousel Code</TableHead>
              <TableHead>Screen Type</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
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
                    <Skeleton className="h-12 w-20 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
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
                    <Skeleton className="h-8 w-[40px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : carousels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Images className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No carousels found.
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start by creating your first carousel
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(true)}
                      className="text-purple-500 border-purple-200 hover:bg-purple-50"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Carousel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              carousels.map((carousel) => (
                <TableRow key={carousel.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={isCarouselSelected(carousel.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCarousel(carousel, checked as boolean)
                      }
                      aria-label={`Select carousel ${carousel.carouselCode}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="h-12 w-20 rounded-lg flex items-center justify-center border bg-gray-50 overflow-hidden">
                      {carousel.url ? (
                        <img
                          src={carousel.url}
                          alt={carousel.carouselCode}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Image className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{carousel.carouselCode}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {carousel.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {carousel.screenType || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        carousel.visibilityType === "ALL"
                          ? "bg-green-100 text-green-700"
                          : carousel.visibilityType === "SUBSCRIBED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {VISIBILITY_TYPES[carousel.visibilityType] || carousel.visibilityType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={carousel.isActive ? "default" : "secondary"}
                      className={
                        carousel.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {carousel.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(carousel.createdAt)}
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
                          onClick={() => handleViewDetailsClick(carousel)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(carousel)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusClick(carousel)}
                          className="cursor-pointer"
                        >
                          {carousel.isActive ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCopyClick(carousel)}
                          className="cursor-pointer"
                        >
                          <GitBranch className="mr-2 h-4 w-4" />
                          Map to Batch
                        </DropdownMenuItem>
                        {carousel.url && (
                          <DropdownMenuItem
                            onClick={() => window.open(carousel.url, "_blank")}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open URL
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRowAuditClick(carousel)}
                          className="cursor-pointer"
                        >
                          <History className="mr-2 h-4 w-4" />
                          Audit Trail
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(carousel)}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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
            Showing {carousels.length} of {totalElements} carousels
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
              disabled={carousels.length < filters.pageSize!}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Carousel Dialog */}
      <CreateCarouselDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSuccess}
        batches={batches}
      />

      {/* Edit Carousel Dialog */}
      <EditCarouselDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleSuccess}
        carouselId={selectedCarousel?.id || null}
        batches={batches}
      />

      {/* Copy Carousel Dialog */}
      <CopyCarouselDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        onSuccess={handleSuccess}
        carousels={selectedCarousels}
        batches={batches}
      />

      {/* View Carousel Details Dialog */}
      <ViewCarouselDetailsDialog
        open={showViewDetailsDialog}
        onOpenChange={setShowViewDetailsDialog}
        carouselId={viewingCarouselId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carousel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete carousel "{selectedCarousel?.carouselCode}"?
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

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedCarousel?.isActive ? "Deactivate" : "Activate"} Carousel
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {selectedCarousel?.isActive ? "deactivate" : "activate"} carousel "
              {selectedCarousel?.carouselCode}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : selectedCarousel?.isActive ? (
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
          setCurrentAuditCarouselId(null);
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
