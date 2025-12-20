import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import {
  fetchASATScorecards,
  updateASATStatus,
  downloadASATInfo,
} from '@/services/asat'
import type {
  ASATStatus,
  ASATScorecard,
  ASATPaginatedResponse,
} from '@/types/asat'

type TabValue = 'pending' | 'approved' | 'rejected'

const TAB_TO_STATUS: Record<TabValue, ASATStatus> = {
  pending: 'PENDING',
  approved: 'VERIFIED',
  rejected: 'REJECTED',
}

const PAGE_SIZE = 10

export default function ASATScorecards() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabValue) || 'pending'

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  // Data states for each tab
  const [pendingData, setPendingData] = useState<ASATPaginatedResponse | null>(null)
  const [approvedData, setApprovedData] = useState<ASATPaginatedResponse | null>(null)
  const [rejectedData, setRejectedData] = useState<ASATPaginatedResponse | null>(null)

  // Page states for each tab
  const [pendingPage, setPendingPage] = useState(0)
  const [approvedPage, setApprovedPage] = useState(0)
  const [rejectedPage, setRejectedPage] = useState(0)

  // Loading states
  const [loading, setLoading] = useState<Record<TabValue, boolean>>({
    pending: true,
    approved: true,
    rejected: true,
  })

  // Dialog state
  const [selectedScorecard, setSelectedScorecard] = useState<ASATScorecard | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<ASATStatus | ''>('')
  const [updating, setUpdating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Get current data/page based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'pending':
        return pendingData
      case 'approved':
        return approvedData
      case 'rejected':
        return rejectedData
    }
  }

  const getCurrentPage = () => {
    switch (activeTab) {
      case 'pending':
        return pendingPage
      case 'approved':
        return approvedPage
      case 'rejected':
        return rejectedPage
    }
  }

  const setCurrentPage = (page: number) => {
    switch (activeTab) {
      case 'pending':
        setPendingPage(page)
        break
      case 'approved':
        setApprovedPage(page)
        break
      case 'rejected':
        setRejectedPage(page)
        break
    }
  }

  // Fetch data for a specific tab
  const fetchTabData = useCallback(
    async (tab: TabValue, page: number, search: string) => {
      setLoading((prev) => ({ ...prev, [tab]: true }))
      try {
        const response = await fetchASATScorecards({
          scoreCardStatus: TAB_TO_STATUS[tab],
          page,
          size: PAGE_SIZE,
          searchText: search || undefined,
        })

        switch (tab) {
          case 'pending':
            setPendingData(response)
            break
          case 'approved':
            setApprovedData(response)
            break
          case 'rejected':
            setRejectedData(response)
            break
        }
      } catch (error) {
        console.error(`Failed to fetch ${tab} data:`, error)
        toast.error(`Failed to load ${tab} scorecards`)
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }))
      }
    },
    []
  )

  // Initial load - fetch all tabs
  useEffect(() => {
    fetchTabData('pending', 0, '')
    fetchTabData('approved', 0, '')
    fetchTabData('rejected', 0, '')
  }, [fetchTabData])

  // Refetch when page changes
  useEffect(() => {
    fetchTabData('pending', pendingPage, activeSearch)
  }, [pendingPage, activeSearch, fetchTabData])

  useEffect(() => {
    fetchTabData('approved', approvedPage, activeSearch)
  }, [approvedPage, activeSearch, fetchTabData])

  useEffect(() => {
    fetchTabData('rejected', rejectedPage, activeSearch)
  }, [rejectedPage, activeSearch, fetchTabData])

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab })
  }, [activeTab, setSearchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue)
  }

  const handleSearch = () => {
    setActiveSearch(searchInput)
    // Reset all pages when searching
    setPendingPage(0)
    setApprovedPage(0)
    setRejectedPage(0)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setActiveSearch('')
    setPendingPage(0)
    setApprovedPage(0)
    setRejectedPage(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await downloadASATInfo(TAB_TO_STATUS[activeTab], activeSearch)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asat-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Failed to download ASAT info')
    } finally {
      setDownloading(false)
    }
  }

  const handleOpenDialog = (scorecard: ASATScorecard) => {
    setSelectedScorecard(scorecard)
    setNewStatus(scorecard.resultInfo.infoStatus)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedScorecard(null)
    setNewStatus('')
  }

  const handleUpdateStatus = async () => {
    if (!selectedScorecard || !newStatus) return

    setUpdating(true)
    try {
      await updateASATStatus({
        userId: selectedScorecard.userId,
        status: newStatus,
        id: selectedScorecard.id,
        rejectionRemarks: null,
      })

      toast.success('Status updated successfully')
      handleCloseDialog()

      // Refetch all tabs to reflect changes
      fetchTabData('pending', pendingPage, activeSearch)
      fetchTabData('approved', approvedPage, activeSearch)
      fetchTabData('rejected', rejectedPage, activeSearch)
    } catch (error) {
      console.error('Update failed:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '-'
    try {
      return new Date(timestamp).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '-'
    }
  }

  const getStatusBadgeVariant = (status: ASATStatus) => {
    switch (status) {
      case 'PENDING':
        return 'secondary'
      case 'VERIFIED':
        return 'default'
      case 'REJECTED':
        return 'destructive'
    }
  }

  const getStatusLabel = (status: ASATStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending'
      case 'VERIFIED':
        return 'Approved'
      case 'REJECTED':
        return 'Rejected'
    }
  }

  const currentData = getCurrentData()
  const currentPage = getCurrentPage()
  const isLoading = loading[activeTab]

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">ASAT Scorecards</h1>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {pendingData && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {pendingData.totalItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              Approved
              {approvedData && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {approvedData.totalItems}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              Rejected
              {rejectedData && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {rejectedData.totalItems}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search and Download */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-[240px] pl-9 pr-8"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch}>
              Search
            </Button>
            {activeSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="text-muted-foreground"
              >
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="mr-2 size-4" />
              {downloading ? 'Downloading...' : 'Download All'}
            </Button>
          </div>
        </div>
      </Tabs>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>Test/10th %</TableHead>
                <TableHead>Discount %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Test Attempted At</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>User Name</TableHead>
                  <TableHead>Test/10th %</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Test Attempted At</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData?.data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No scorecards found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData?.data.map((scorecard) => (
                    <TableRow key={scorecard.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          {scorecard.userPhone && (
                            <p className="text-xs text-muted-foreground">
                              Phone: {scorecard.userPhone}
                            </p>
                          )}
                          <p className="font-mono text-xs text-muted-foreground/70">
                            {scorecard.userId.slice(0, 16)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {scorecard.userName}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{scorecard.testInfo.percentage}%</span>
                        {scorecard.marksheetInfo.percent !== null && (
                          <span className="text-muted-foreground">
                            {' '}/ {scorecard.marksheetInfo.percent}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{scorecard.resultInfo.percentDiscount}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(scorecard.resultInfo.infoStatus)}>
                          {getStatusLabel(scorecard.resultInfo.infoStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(scorecard.testInfo.date)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(scorecard)}
                        >
                          Action
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {currentData && currentData.totalPages > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {currentData.totalItems} items
                </p>
                {currentData.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage + 1} of {currentData.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= currentData.totalPages - 1}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Scorecard Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" showCloseButton={false}>
          <DialogHeader className="flex-row items-center justify-between space-y-0">
            <DialogTitle>Update Scorecard Status</DialogTitle>
            {selectedScorecard && (
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as ASATStatus)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="VERIFIED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          </DialogHeader>

          {selectedScorecard && (
            <div className="space-y-4">
              <Card>
                <CardContent className="grid gap-3 p-4">
                  {/* User Info */}
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">User ID:</span>
                    <span className="font-mono text-xs break-all">
                      {selectedScorecard.userId}
                    </span>
                  </div>

                  {/* Scorecard Image */}
                  {selectedScorecard.marksheetInfo.url && (
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                      <span className="text-muted-foreground">Scorecard:</span>
                      <a
                        href={selectedScorecard.marksheetInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        View Image <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">User Name:</span>
                    <span className="font-medium">{selectedScorecard.userName}</span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">User Phone:</span>
                    <span>{selectedScorecard.userPhone || 'N/A'}</span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">10th %:</span>
                    <span>
                      {selectedScorecard.marksheetInfo.percent !== null
                        ? `${selectedScorecard.marksheetInfo.percent}%`
                        : '-'}
                    </span>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Created At:</span>
                    <span>{formatTimestamp(selectedScorecard.resultInfo.createdOn)}</span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Test Attempted:</span>
                    <span>{formatDate(selectedScorecard.testInfo.date)}</span>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Marks:</span>
                    <span className="font-medium">
                      {selectedScorecard.testInfo.marks} / {selectedScorecard.testInfo.totalMarks}
                    </span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Test %:</span>
                    <span className="font-medium">{selectedScorecard.testInfo.percentage}%</span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Test Group ID:</span>
                    <span className="font-mono text-xs">{selectedScorecard.testInfo.testGroupId}</span>
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Test ID:</span>
                    <span className="font-mono text-xs">{selectedScorecard.testInfo.testId}</span>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                    <span className="text-muted-foreground">Discount %:</span>
                    <span className="font-semibold text-lg">
                      {selectedScorecard.resultInfo.percentDiscount}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Close
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updating || !newStatus || newStatus === selectedScorecard?.resultInfo.infoStatus}
            >
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
