import { useState, useEffect } from "react";
import { useSignals } from "@preact/signals-react/runtime";
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
} from "lucide-react";

// Import signals and actions
import {
  cards,
  cardsLoading,
  totalElements,
  cardFilters,
  searchQuery,
  selectedCard,
  selectedCards,
  batches,
  isSubmitting,
  loadCards,
  loadBatches,
  deleteSelectedCard,
  toggleSelectedCardStatus,
  selectAllCards,
  clearAllSelections,
  updateFilters,
} from "@/signals/homeScreenCardsState";

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
import { ViewCardDetailsDialog } from "./ViewCardDetailsDialog";
import type { HomeScreenCardListResponse } from "@/types/homeScreenCards";
import {
  ICON_MEDIA_TYPES,
  VISIBILITY_TYPES,
} from "@/types/homeScreenCards";

export default function HomeScreenCardsPage() {
  useSignals();

  // Local UI state (dialogs only)
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false);
  const [viewingCardId, setViewingCardId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Load cards when filters change
  useEffect(() => {
    loadCards();
  }, [cardFilters.value]);

  // Load batches on mount
  useEffect(() => {
    loadBatches();
  }, []);

  // Handlers using signals
  const handleSearch = (query: string) => {
    searchQuery.value = query;
    updateFilters({ search: query || undefined, pageNo: 0 });
  };

  const handleSuccess = () => {
    loadCards();
  };

  const handleSelectCard = (card: HomeScreenCardListResponse, checked: boolean) => {
    if (checked) {
      selectedCards.value = [...selectedCards.value, card];
    } else {
      selectedCards.value = selectedCards.value.filter((c) => c.id !== card.id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllCards();
    } else {
      clearAllSelections();
    }
  };

  const isCardSelected = (cardId: number) => {
    return selectedCards.value.some((c) => c.id === cardId);
  };

  const isAllSelected =
    cards.value.length > 0 && selectedCards.value.length === cards.value.length;
  const isIndeterminate =
    selectedCards.value.length > 0 && selectedCards.value.length < cards.value.length;

  // Handle View Details
  const handleViewDetailsClick = (card: HomeScreenCardListResponse) => {
    setViewingCardId(card.id);
    setShowViewDetailsDialog(true);
  };

  // Handle Edit Card
  const handleEditClick = (card: HomeScreenCardListResponse) => {
    selectedCard.value = card;
    setShowEditDialog(true);
  };

  // Handle Copy Card
  const handleCopyClick = (card: HomeScreenCardListResponse) => {
    selectedCard.value = card;
    setShowCopyDialog(true);
  };

  // Handle Delete Card
  const handleDeleteClick = (card: HomeScreenCardListResponse) => {
    selectedCard.value = card;
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteSelectedCard();
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  // Handle Status Toggle
  const handleStatusClick = (card: HomeScreenCardListResponse) => {
    selectedCard.value = card;
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    const success = await toggleSelectedCardStatus();
    if (success) {
      setStatusDialogOpen(false);
    }
  };

  const handleFilterByBatch = (batchId: string) => {
    if (batchId === "all") {
      const { batchId: _, ...rest } = cardFilters.value;
      cardFilters.value = rest;
    } else {
      updateFilters({ batchId: Number(batchId), pageNo: 0 });
    }
  };

  const handleFilterByStatus = (active: string) => {
    if (active === "all") {
      const { active: _, ...rest } = cardFilters.value;
      cardFilters.value = rest;
    } else {
      updateFilters({ active: active === "true", pageNo: 0 });
    }
  };

  const handleClearFilters = () => {
    cardFilters.value = {
      pageNo: 0,
      pageSize: 20,
      sortBy: "createdAt",
      sortDir: "DESC",
    };
    searchQuery.value = "";
  };

  const handlePrevPage = () => {
    updateFilters({ pageNo: Math.max(0, (cardFilters.value.pageNo || 0) - 1) });
  };

  const handleNextPage = () => {
    updateFilters({ pageNo: (cardFilters.value.pageNo || 0) + 1 });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Use signal values
  const filters = cardFilters.value;
  const loading = cardsLoading.value;
  const activeCards = cards.value.filter((c) => c.isActive).length;
  const allVisibilityCards = cards.value.filter((c) => c.visibilityType === "ALL").length;

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
            {selectedCards.value.length > 0 && (
              <span className="ml-2 text-cyan-600 font-medium">
                • {selectedCards.value.length} card
                {selectedCards.value.length > 1 ? "s" : ""} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedCards.value.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                selectedCard.value = selectedCards.value[0];
                setShowCopyDialog(true);
              }}
              className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy ({selectedCards.value.length})
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
              value={searchQuery.value}
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
            {batches.value.map((batch) => (
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

        <Button variant="outline" onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {totalElements.value}
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

        <div className="rounded-md border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold text-foreground leading-tight">
                {cards.value.length - activeCards}
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-12 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[40px]" /></TableCell>
                </TableRow>
              ))
            ) : cards.value.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">No cards found.</p>
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
              cards.value.map((card) => (
                <TableRow key={card.id} className="hover:bg-muted/30">
                  <TableCell>
                    <Checkbox
                      checked={isCardSelected(card.id)}
                      onCheckedChange={(checked) => handleSelectCard(card, checked as boolean)}
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
                      <div className="text-xs text-muted-foreground">ID: {card.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {card.tag ? (
                      <Badge style={{ backgroundColor: card.tagBackgroundColor || "#e5e7eb", color: "#374151" }}>
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
                    <div className="text-sm text-muted-foreground">{formatDate(card.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetailsClick(card)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(card)} className="cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusClick(card)} className="cursor-pointer">
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
                        <DropdownMenuItem onClick={() => handleCopyClick(card)} className="cursor-pointer">
                          <Copy className="mr-2 h-4 w-4" />
                          Copy to Batch
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(card)} className="text-red-600 cursor-pointer">
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
      {totalElements.value > (filters.pageSize || 20) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {cards.value.length} of {totalElements.value} cards
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={filters.pageNo === 0}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {(filters.pageNo || 0) + 1} of {Math.ceil(totalElements.value / (filters.pageSize || 20))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={cards.value.length < (filters.pageSize || 20)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateCardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSuccess}
        batches={batches.value}
      />

      <EditCardDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleSuccess}
        cardId={selectedCard.value?.id || null}
        batches={batches.value}
      />

      <CopyCardDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        onSuccess={handleSuccess}
        card={selectedCard.value}
        batches={batches.value}
      />

      <ViewCardDetailsDialog
        open={showViewDetailsDialog}
        onOpenChange={setShowViewDetailsDialog}
        cardId={viewingCardId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete card "{selectedCard.value?.title}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting.value}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting.value}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting.value ? (
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

      {/* Status Toggle Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedCard.value?.isActive ? "Deactivate" : "Activate"} Card
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedCard.value?.isActive ? "deactivate" : "activate"} card "
              {selectedCard.value?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting.value}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusConfirm} disabled={isSubmitting.value}>
              {isSubmitting.value ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : selectedCard.value?.isActive ? (
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
