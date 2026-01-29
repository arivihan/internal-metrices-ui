import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  LayoutGrid,
  Eye,
  EyeOff,
  Image,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
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

import { CreateCardDialog } from "./CreateCardDialog";
import { EditCardDialog } from "./EditCardDialog";
import { CopyCardDialog } from "./CopyCardDialog";
import {
  fetchHomeScreenCards,
  fetchAllBatchesForCards,
  deleteHomeScreenCard,
  toggleHomeScreenCardStatus,
} from "@/services/homeScreenCards";
import type {
  HomeScreenCardListResponse,
  HomeScreenCardFilters,
} from "@/types/homeScreenCards";
import {
  ICON_MEDIA_TYPES,
  VISIBILITY_TYPES,
} from "@/types/homeScreenCards";

interface BatchOption {
  id: number;
  name: string;
  code?: string;
}

export default function HomeScreenCardsPage() {
  const [cards, setCards] = useState<HomeScreenCardListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedCards, setSelectedCards] = useState<HomeScreenCardListResponse[]>([]);
  const [selectedCard, setSelectedCard] = useState<HomeScreenCardListResponse | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [filters, setFilters] = useState<HomeScreenCardFilters>({
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

  useEffect(() => {
    loadCards();
  }, [filters]);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      console.log("[HomeScreenCardsPage] Loading cards with filters:", filters);
      const response = await fetchHomeScreenCards(filters);
      console.log("[HomeScreenCardsPage] Cards response:", response);

      setCards(response.content || []);
      setTotalElements(response.totalElements || 0);

      console.log(
        "[HomeScreenCardsPage] Set cards:",
        response.content?.length || 0,
        "items"
      );
    } catch (error) {
      console.error("[HomeScreenCardsPage] Failed to load cards:", error);
      toast.error(
        "Failed to load cards: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      setCards([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const batchesRes = await fetchAllBatchesForCards({ activeFlag: true });
      setBatches(batchesRes);
    } catch (error) {
      console.error("[HomeScreenCardsPage] Failed to load batches:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, search: query || undefined, pageNo: 0 }));
  };

  const handleSuccess = () => {
    toast.success("Operation completed successfully!");
    loadCards();
  };

  const handleSelectCard = (card: HomeScreenCardListResponse, checked: boolean) => {
    if (checked) {
      setSelectedCards((prev) => [...prev, card]);
    } else {
      setSelectedCards((prev) => prev.filter((c) => c.id !== card.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCards([...cards]);
    } else {
      setSelectedCards([]);
    }
  };

  const isCardSelected = (cardId: number) => {
    return selectedCards.some((c) => c.id === cardId);
  };

  const isAllSelected =
    cards.length > 0 && selectedCards.length === cards.length;
  const isIndeterminate =
    selectedCards.length > 0 && selectedCards.length < cards.length;

  // Handle Edit Card
  const handleEditClick = (card: HomeScreenCardListResponse) => {
    setSelectedCard(card);
    setShowEditDialog(true);
  };

  // Handle Copy Card
  const handleCopyClick = (card: HomeScreenCardListResponse) => {
    setSelectedCard(card);
    setShowCopyDialog(true);
  };

  // Handle Delete Card
  const handleDeleteClick = (card: HomeScreenCardListResponse) => {
    setSelectedCard(card);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCard) return;

    setIsSubmitting(true);
    try {
      await deleteHomeScreenCard(selectedCard.id);
      toast.success("Card deleted successfully!");
      setDeleteDialogOpen(false);
      setSelectedCard(null);
      loadCards();
    } catch (error) {
      console.error("Failed to delete card:", error);
      toast.error("Failed to delete card");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle
  const handleStatusClick = (card: HomeScreenCardListResponse) => {
    setSelectedCard(card);
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedCard) return;

    setIsSubmitting(true);
    try {
      await toggleHomeScreenCardStatus(selectedCard.id, !selectedCard.isActive);
      toast.success(
        `Card ${selectedCard.isActive ? "deactivated" : "activated"} successfully!`
      );
      setStatusDialogOpen(false);
      setSelectedCard(null);
      loadCards();
    } catch (error) {
      console.error("Failed to toggle card status:", error);
      toast.error("Failed to update card status");
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Stats calculations
  const activeCards = cards.filter((c) => c.isActive).length;
  const allVisibilityCards = cards.filter((c) => c.visibilityType === "ALL").length;

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutGrid className="h-8 w-8 text-cyan-500" />
            Home Screen Cards
          </h1>
          <p className="text-muted-foreground">
            Manage home screen cards for different batches
            {selectedCards.length > 0 && (
              <span className="ml-2 text-cyan-600 font-medium">
                • {selectedCards.length} card
                {selectedCards.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCards.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCard(selectedCards[0]);
                setShowCopyDialog(true);
              }}
              className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy ({selectedCards.length})
            </Button>
          )}
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Card
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
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
        {/* Total Cards */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {totalElements}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Total Cards
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
              <LayoutGrid className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Active Cards */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {activeCards}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Active Cards
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Eye className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* All Visibility Cards */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {allVisibilityCards}
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

        {/* Inactive Cards */}
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {cards.length - activeCards}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Inactive Cards
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-500/10">
              <EyeOff className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards Table */}
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
                  aria-label="Select all cards"
                />
              </TableHead>
              <TableHead className="w-[80px]">Icon</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Media Type</TableHead>
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
                    <Skeleton className="h-12 w-12 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
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
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[40px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No cards found.
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start by creating your first home screen card
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(true)}
                      className="text-cyan-500 border-cyan-200 hover:bg-cyan-50"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Card
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => (
                <TableRow key={card.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={isCardSelected(card.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCard(card, checked as boolean)
                      }
                      aria-label={`Select card ${card.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center border"
                      style={{ backgroundColor: card.iconBackgroundColor || "#f3f4f6" }}
                    >
                      {card.icon ? (
                        <img
                          src={card.icon}
                          alt={card.title}
                          className="h-8 w-8 object-contain"
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
                      <div className="font-medium text-sm">{card.title}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {card.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {card.tag ? (
                      <Badge
                        style={{
                          backgroundColor: card.tagBackgroundColor || "#e5e7eb",
                          color: "#374151",
                        }}
                      >
                        {card.tag}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                      {ICON_MEDIA_TYPES[card.iconMediaType] || card.iconMediaType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        card.visibilityType === "ALL"
                          ? "bg-green-100 text-green-700"
                          : card.visibilityType === "SUBSCRIBED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {VISIBILITY_TYPES[card.visibilityType] || card.visibilityType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={card.isActive ? "default" : "secondary"}
                      className={
                        card.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {card.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(card.createdAt)}
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
                          onClick={() => handleEditClick(card)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusClick(card)}
                          className="cursor-pointer"
                        >
                          {card.isActive ? (
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
                          onClick={() => handleCopyClick(card)}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy to Batch
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(card)}
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
            Showing {cards.length} of {totalElements} cards
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
              disabled={cards.length < filters.pageSize!}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Card Dialog */}
      <CreateCardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSuccess}
        batches={batches}
      />

      {/* Edit Card Dialog */}
      <EditCardDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleSuccess}
        cardId={selectedCard?.id || null}
        batches={batches}
      />

      {/* Copy Card Dialog */}
      <CopyCardDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        onSuccess={handleSuccess}
        card={selectedCard}
        batches={batches}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete card "{selectedCard?.title}"?
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
              {selectedCard?.isActive ? "Deactivate" : "Activate"} Card
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {selectedCard?.isActive ? "deactivate" : "activate"} card "
              {selectedCard?.title}"?
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
              ) : selectedCard?.isActive ? (
                "Deactivate"
              ) : (
                "Activate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
