import { useEffect, useState } from 'react'
import { useSignals } from "@preact/signals-react/runtime"
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  MoreHorizontal,
  Filter,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Link2,
  X,
  Save,
  History,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'

import { AddChapterDialog } from './AddChapterDialog'
import { AuditTrailPopup } from '@/components/AuditTrailPopup'
import {
  fetchChapterAuditTrail,
  fetchChaptersTableAuditTrail,
} from '@/services/chapters'
import type { ChapterDto } from '@/types/chapters'

// Import signals
import {
  chapters,
  chaptersLoading,
  totalElements,
  totalPages,
  currentPage,
  exams,
  grades,
  streams,
  batches,
  batchAddOns,
  subjects,
  examFilter,
  gradeFilter,
  streamFilter,
  batchFilter,
  batchAddOnFilter,
  subjectFilter,
  chapterCodeFilter,
  loadingGrades,
  loadingStreams,
  loadingBatches,
  loadingBatchAddOns,
  selectedChapters,
  chapterToDelete,
  isDeleting,
  isTogglingStatus,
  showMappingView,
  mappingDisplayOrders,
  isSavingMapping,
  mappingExamFilter,
  mappingGradeFilter,
  mappingStreamFilter,
  mappingBatchFilter,
  mappingBatchAddOnFilter,
  mappingGrades,
  mappingStreams,
  mappingBatches,
  mappingBatchAddOns,
  loadingMappingGrades,
  loadingMappingStreams,
  loadingMappingBatches,
  loadingMappingBatchAddOns,
  loadChapters,
  loadExams,
  loadGrades,
  loadStreams,
  loadBatchOptions,
  loadBatchAddOnOptions,
  loadSubjects,
  toggleChapterSelection,
  selectAllChapters,
  clearAllSelections,
  setPage,
  clearFilters,
} from '@/signals/chaptersState'

export default function Chapters() {
  useSignals()

  // Local UI state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  // Audit Trail state (local)
  const [auditTrailOpen, setAuditTrailOpen] = useState(false)
  const [auditTrailData, setAuditTrailData] = useState<any[]>([])
  const [auditTrailLoading, setAuditTrailLoading] = useState(false)
  const [auditTrailTitle, setAuditTrailTitle] = useState("Audit Trail")
  const [auditTrailPagination, setAuditTrailPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  })
  const [currentAuditChapterId, setCurrentAuditChapterId] = useState<string | null>(null)
  const [isTableAudit, setIsTableAudit] = useState(false)

  // Get signal values
  const data = chapters.value
  const loading = chaptersLoading.value
  const total = totalElements.value
  const pages = totalPages.value
  const page = currentPage.value
  const examsList = exams.value
  const gradesList = grades.value
  const streamsList = streams.value
  const batchesList = batches.value
  const batchAddOnsList = batchAddOns.value
  const subjectsList = subjects.value
  const examVal = examFilter.value
  const gradeVal = gradeFilter.value
  const streamVal = streamFilter.value
  const batchVal = batchFilter.value
  const batchAddOnVal = batchAddOnFilter.value
  const subjectVal = subjectFilter.value
  const chapterCodeVal = chapterCodeFilter.value
  const loadingGradesVal = loadingGrades.value
  const loadingStreamsVal = loadingStreams.value
  const loadingBatchesVal = loadingBatches.value
  const loadingBatchAddOnsVal = loadingBatchAddOns.value
  const selected = selectedChapters.value
  const toDelete = chapterToDelete.value
  const deletingVal = isDeleting.value
  const togglingVal = isTogglingStatus.value
  const showMapping = showMappingView.value
  const mappingOrders = mappingDisplayOrders.value
  const savingMapping = isSavingMapping.value
  const mappingExam = mappingExamFilter.value
  const mappingGrade = mappingGradeFilter.value
  const mappingStream = mappingStreamFilter.value
  const mappingBatch = mappingBatchFilter.value
  const mappingBatchAddOn = mappingBatchAddOnFilter.value
  const mappingGradesList = mappingGrades.value
  const mappingStreamsList = mappingStreams.value
  const mappingBatchesList = mappingBatches.value
  const mappingBatchAddOnsList = mappingBatchAddOns.value
  const loadingMapGrades = loadingMappingGrades.value
  const loadingMapStreams = loadingMappingStreams.value
  const loadingMapBatches = loadingMappingBatches.value
  const loadingMapAddOns = loadingMappingBatchAddOns.value

  // Load initial filter options
  useEffect(() => {
    loadExams()
    loadSubjects()
  }, [])

  // Cascading: When Exam changes → Load Grades
  useEffect(() => {
    if (examVal) {
      loadGrades(examVal)
    } else {
      grades.value = []
      gradeFilter.value = ''
      streams.value = []
      streamFilter.value = ''
      batches.value = []
      batchFilter.value = ''
      batchAddOns.value = []
      batchAddOnFilter.value = ''
    }
  }, [examVal])

  // Cascading: When Grade changes → Load Streams
  useEffect(() => {
    if (examVal && gradeVal) {
      loadStreams(examVal, gradeVal)
    } else {
      streams.value = []
      streamFilter.value = ''
      batches.value = []
      batchFilter.value = ''
      batchAddOns.value = []
      batchAddOnFilter.value = ''
    }
  }, [gradeVal])

  // Cascading: When Stream changes → Load Batches
  useEffect(() => {
    if (examVal && gradeVal && streamVal) {
      loadBatchOptions(examVal, gradeVal, streamVal)
    } else {
      batches.value = []
      batchFilter.value = ''
      batchAddOns.value = []
      batchAddOnFilter.value = ''
    }
  }, [streamVal])

  // Cascading: When Batch changes → Load Batch Add-Ons
  useEffect(() => {
    if (batchVal) {
      loadBatchAddOnOptions(batchVal)
    } else {
      batchAddOns.value = []
      batchAddOnFilter.value = ''
    }
  }, [batchVal])

  // Load chapters when filters change
  useEffect(() => {
    loadChapters()
  }, [page, examVal, gradeVal, streamVal, batchVal, batchAddOnVal, subjectVal, chapterCodeVal])

  const handleFilterChange = (signal: any, value: string) => {
    signal.value = value
    currentPage.value = 0
  }

  const handleDialogSuccess = () => {
    loadChapters()
  }

  // Handle delete chapter
  const handleDeleteClick = (chapter: ChapterDto) => {
    chapterToDelete.value = chapter
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!toDelete) return

    isDeleting.value = true
    try {
      const { dynamicRequest } = await import('@/services/apiClient')
      await dynamicRequest(
        `/secure/api/v1/chapter/${toDelete.chapterId}/delete`,
        'DELETE'
      )
      toast.success('Chapter deleted successfully')
      setDeleteDialogOpen(false)
      chapterToDelete.value = null
      loadChapters()
    } catch (error: any) {
      console.error('Failed to delete chapter:', error)
      toast.error(error?.message || 'Failed to delete chapter')
    } finally {
      isDeleting.value = false
    }
  }

  // Handle toggle active/inactive status
  const handleToggleStatus = async (chapter: ChapterDto) => {
    isTogglingStatus.value = chapter.chapterId
    try {
      const { dynamicRequest } = await import('@/services/apiClient')
      const newStatus = !chapter.active
      await dynamicRequest(
        `/secure/api/v1/chapter/${chapter.chapterId}/status`,
        'PATCH',
        { isActive: newStatus }
      )
      toast.success(
        `Chapter ${chapter.active ? 'deactivated' : 'activated'} successfully`
      )
      loadChapters()
    } catch (error: any) {
      console.error('Failed to change chapter status:', error)
      toast.error(error?.message || 'Failed to change chapter status')
    } finally {
      isTogglingStatus.value = null
    }
  }

  // Selection handlers
  const handleSelectChapter = (chapterId: string, checked: boolean) => {
    toggleChapterSelection(chapterId)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllChapters()
    } else {
      clearAllSelections()
    }
  }

  const isAllSelected = data.length > 0 && selected.size === data.length
  const isSomeSelected = selected.size > 0 && selected.size < data.length

  // Mapping view handlers
  const handleOpenMappingView = () => {
    const orders: Record<string, number> = {}
    data.filter(c => selected.has(c.chapterId)).forEach((chapter, idx) => {
      orders[chapter.chapterId] = chapter.pos ?? (idx + 1)
    })
    mappingDisplayOrders.value = orders
    showMappingView.value = true
  }

  const handleCloseMappingView = () => {
    showMappingView.value = false
    mappingExamFilter.value = ''
    mappingGradeFilter.value = ''
    mappingStreamFilter.value = ''
    mappingBatchFilter.value = ''
    mappingBatchAddOnFilter.value = ''
    mappingGrades.value = []
    mappingStreams.value = []
    mappingBatches.value = []
    mappingBatchAddOns.value = []
  }

  const handleDisplayOrderChange = (chapterId: string, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      mappingDisplayOrders.value = {
        ...mappingOrders,
        [chapterId]: numValue
      }
    }
  }

  // Mapping cascading filters
  const loadMappingGrades = async (examId: string) => {
    if (!examId) {
      mappingGrades.value = []
      return
    }
    loadingMappingGrades.value = true
    try {
      const { fetchGradesByExam } = await import('@/services/chapters')
      const response = await fetchGradesByExam({ examId: Number(examId) })
      mappingGrades.value = response.content
    } catch (error) {
      console.error('Failed to load mapping grades:', error)
      mappingGrades.value = []
    } finally {
      loadingMappingGrades.value = false
    }
  }

  const loadMappingStreams = async (examId: string, gradeId: string) => {
    if (!examId || !gradeId) {
      mappingStreams.value = []
      return
    }
    loadingMappingStreams.value = true
    try {
      const { fetchStreamsByExamGrade } = await import('@/services/chapters')
      const response = await fetchStreamsByExamGrade({
        examId: Number(examId),
        gradeId: Number(gradeId),
      })
      mappingStreams.value = response.content
    } catch (error) {
      console.error('Failed to load mapping streams:', error)
      mappingStreams.value = []
    } finally {
      loadingMappingStreams.value = false
    }
  }

  const loadMappingBatches = async (examId: string, gradeId: string, streamId: string) => {
    if (!examId || !gradeId || !streamId) {
      mappingBatches.value = []
      return
    }
    loadingMappingBatches.value = true
    try {
      const { fetchBatches } = await import('@/services/chapters')
      const response = await fetchBatches({
        examId: Number(examId),
        gradeId: Number(gradeId),
        streamId: Number(streamId),
        activeFlag: true,
      })
      mappingBatches.value = response.content
    } catch (error) {
      console.error('Failed to load mapping batches:', error)
      mappingBatches.value = []
    } finally {
      loadingMappingBatches.value = false
    }
  }

  const loadMappingBatchAddOns = async (batchId: string) => {
    if (!batchId) {
      mappingBatchAddOns.value = []
      return
    }
    loadingMappingBatchAddOns.value = true
    try {
      const { fetchBatchAddOns } = await import('@/services/chapters')
      const response = await fetchBatchAddOns({ batchId: Number(batchId) })
      mappingBatchAddOns.value = response.content
    } catch (error) {
      console.error('Failed to load mapping batch add-ons:', error)
      mappingBatchAddOns.value = []
    } finally {
      loadingMappingBatchAddOns.value = false
    }
  }

  const handleMappingExamChange = (value: string) => {
    mappingExamFilter.value = value === 'all' ? '' : value
    mappingGradeFilter.value = ''
    mappingStreamFilter.value = ''
    mappingBatchFilter.value = ''
    mappingBatchAddOnFilter.value = ''
    mappingGrades.value = []
    mappingStreams.value = []
    mappingBatches.value = []
    mappingBatchAddOns.value = []
    if (value && value !== 'all') {
      loadMappingGrades(value)
    }
  }

  const handleMappingGradeChange = (value: string) => {
    mappingGradeFilter.value = value === 'all' ? '' : value
    mappingStreamFilter.value = ''
    mappingBatchFilter.value = ''
    mappingBatchAddOnFilter.value = ''
    mappingStreams.value = []
    mappingBatches.value = []
    mappingBatchAddOns.value = []
    if (value && value !== 'all' && mappingExam) {
      loadMappingStreams(mappingExam, value)
    }
  }

  const handleMappingStreamChange = (value: string) => {
    mappingStreamFilter.value = value === 'all' ? '' : value
    mappingBatchFilter.value = ''
    mappingBatchAddOnFilter.value = ''
    mappingBatches.value = []
    mappingBatchAddOns.value = []
    if (value && value !== 'all' && mappingExam && mappingGrade) {
      loadMappingBatches(mappingExam, mappingGrade, value)
    }
  }

  const handleMappingBatchChange = (value: string) => {
    mappingBatchFilter.value = value === 'all' ? '' : value
    mappingBatchAddOnFilter.value = ''
    mappingBatchAddOns.value = []
    if (value && value !== 'all') {
      loadMappingBatchAddOns(value)
    }
  }

  // Save mapping
  const handleSaveMapping = async () => {
    if (!mappingBatch) {
      toast.error('Please select a batch')
      return
    }

    const chaptersToMap = Array.from(selected).map(chapterId => ({
      chapterId: String(chapterId),
      displayOrder: mappingOrders[chapterId] ?? 0,
    }))

    if (chaptersToMap.length === 0) {
      toast.error('No chapters selected')
      return
    }

    isSavingMapping.value = true
    try {
      const { dynamicRequest } = await import('@/services/apiClient')

      let url = `/secure/api/v1/chapter-mappings?batchId=${mappingBatch}`
      if (mappingBatchAddOn) {
        url += `&batchAddonId=${mappingBatchAddOn}`
      }

      await dynamicRequest(url, 'POST', chaptersToMap)

      toast.success('Chapters mapped successfully')
      handleCloseMappingView()
      selectedChapters.value = new Set()
      loadChapters()
    } catch (error: any) {
      console.error('Failed to save mapping:', error)
      toast.error(error?.message || 'Failed to save mapping')
    } finally {
      isSavingMapping.value = false
    }
  }

  // Audit Trail handlers
  const fetchAuditTrailPage = async (
    chapterId: string | null,
    pageNo: number,
    tableAudit: boolean,
    pageSizeParam?: number
  ) => {
    const size = pageSizeParam ?? auditTrailPagination.pageSize
    setAuditTrailLoading(true)
    try {
      let response
      if (tableAudit) {
        response = await fetchChaptersTableAuditTrail(pageNo, size)
      } else if (chapterId) {
        response = await fetchChapterAuditTrail(chapterId, pageNo, size)
      } else {
        return
      }

      setAuditTrailData(response.content || [])
      setAuditTrailPagination({
        currentPage: response.pageNumber ?? pageNo,
        totalPages: response.totalPages ?? 0,
        totalElements: response.totalElements ?? 0,
        pageSize: response.pageSize ?? size,
      })
    } catch (error) {
      console.error('Failed to fetch audit trail:', error)
      toast.error('Failed to fetch audit trail')
      setAuditTrailData([])
    } finally {
      setAuditTrailLoading(false)
    }
  }

  const handleRowAuditClick = async (chapter: ChapterDto) => {
    setCurrentAuditChapterId(chapter.chapterId)
    setIsTableAudit(false)
    setAuditTrailTitle(`Audit Trail - ${chapter.title || chapter.chapterName || chapter.chapterCode}`)
    setAuditTrailOpen(true)
    await fetchAuditTrailPage(chapter.chapterId, 0, false)
  }

  const handleTableAuditClick = async () => {
    setCurrentAuditChapterId(null)
    setIsTableAudit(true)
    setAuditTrailTitle("Chapters Table Audit Trail")
    setAuditTrailOpen(true)
    await fetchAuditTrailPage(null, 0, true)
  }

  const handleAuditPageChange = (newPage: number) => {
    fetchAuditTrailPage(currentAuditChapterId, newPage, isTableAudit)
  }

  const handleAuditPageSizeChange = (newPageSize: number) => {
    fetchAuditTrailPage(currentAuditChapterId, 0, isTableAudit, newPageSize)
  }

  const hasActiveFilters =
    examVal ||
    gradeVal ||
    streamVal ||
    batchVal ||
    batchAddOnVal ||
    subjectVal ||
    chapterCodeVal

  const handleClearFilters = () => {
    clearFilters()
  }

  // Mapping View UI
  if (showMapping) {
    const selectedChaptersList = data.filter(c => selected.has(c.chapterId))

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseMappingView}
              className="size-8"
            >
              <X className="size-4" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create Chapter Mapping
              <span className="ml-2 text-muted-foreground text-lg">
                ({selectedChaptersList.length} chapters selected)
              </span>
            </h1>
          </div>
          <Button
            onClick={handleSaveMapping}
            disabled={savingMapping || !mappingBatch}
            className="gap-2"
          >
            <Save className="size-4" />
            {savingMapping ? 'Saving...' : 'Save Mapping'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Selected Chapters */}
          <div className="rounded-lg border bg-card flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/50">
              <h2 className="font-semibold">Selected Chapters</h2>
              <p className="text-sm text-muted-foreground">Edit display order for each chapter</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedChaptersList.map((chapter) => (
                <div
                  key={chapter.chapterId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {chapter.title || chapter.chapterName}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {chapter.chapterCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Order:</span>
                    <Input
                      type="number"
                      min="0"
                      value={mappingOrders[chapter.chapterId] ?? 0}
                      onChange={(e) => handleDisplayOrderChange(chapter.chapterId, e.target.value)}
                      className="w-20 h-8 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Mapping Filters */}
          <div className="rounded-lg border bg-card flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/50">
              <h2 className="font-semibold">Select Mapping Target</h2>
              <p className="text-sm text-muted-foreground">Choose where to map the chapters</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Exam *</label>
                <Select value={mappingExam || "all"} onValueChange={handleMappingExamChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Exam</SelectItem>
                    {examsList.map((exam) => (
                      <SelectItem key={exam.id} value={String(exam.id)}>{exam.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grade *</label>
                <Select
                  value={mappingGrade || "all"}
                  onValueChange={handleMappingGradeChange}
                  disabled={!mappingExam || loadingMapGrades}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMapGrades ? "Loading..." : "Select Grade"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Grade</SelectItem>
                    {mappingGradesList.map((grade) => (
                      <SelectItem key={grade.id} value={String(grade.id)}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stream *</label>
                <Select
                  value={mappingStream || "all"}
                  onValueChange={handleMappingStreamChange}
                  disabled={!mappingGrade || loadingMapStreams}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMapStreams ? "Loading..." : "Select Stream"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Stream</SelectItem>
                    {mappingStreamsList.map((stream) => (
                      <SelectItem key={stream.id} value={String(stream.id)}>{stream.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Batch *</label>
                <Select
                  value={mappingBatch || "all"}
                  onValueChange={handleMappingBatchChange}
                  disabled={!mappingStream || loadingMapBatches}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMapBatches ? "Loading..." : "Select Batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Batch</SelectItem>
                    {mappingBatchesList.map((batch) => (
                      <SelectItem key={batch.id} value={String(batch.id)}>{batch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Add-On (Optional)</label>
                <Select
                  value={mappingBatchAddOn || "all"}
                  onValueChange={(v) => mappingBatchAddOnFilter.value = v === "all" ? "" : v}
                  disabled={!mappingBatch || loadingMapAddOns}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMapAddOns ? "Loading..." : "Select Add-On"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No Add-On</SelectItem>
                    {mappingBatchAddOnsList.map((addon) => (
                      <SelectItem key={addon.id} value={String(addon.id)}>{addon.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!mappingBatch && (
                <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg">
                  Please select Exam, Grade, Stream, and Batch to save the mapping.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Chapters
          {total > 0 && (
            <span className="ml-2 text-muted-foreground">({total})</span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Button variant="default" onClick={handleOpenMappingView} className="gap-2">
              <Link2 className="size-4" />
              Create Mapping ({selected.size})
            </Button>
          )}
          <Button variant="outline" onClick={handleTableAuditClick} className="gap-2">
            <History className="size-4" />
            Table Audit
          </Button>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="gap-2 border-brand/50 text-brand hover:bg-brand/10"
          >
            <Upload className="size-4" />
            Upload Chapters
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Chapter Code..."
          value={chapterCodeVal}
          onChange={(e) => handleFilterChange(chapterCodeFilter, e.target.value)}
          className="w-40"
        />

        <Select
          value={examVal || "all"}
          onValueChange={(v) => handleFilterChange(examFilter, v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {examsList.map((exam) => (
              <SelectItem key={exam.id} value={String(exam.id)}>{exam.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={gradeVal || "all"}
          onValueChange={(v) => handleFilterChange(gradeFilter, v === "all" ? "" : v)}
          disabled={!examVal || loadingGradesVal}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingGradesVal ? "Loading..." : "Grade"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {gradesList.map((grade) => (
              <SelectItem key={grade.id} value={String(grade.id)}>{grade.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={streamVal || "all"}
          onValueChange={(v) => handleFilterChange(streamFilter, v === "all" ? "" : v)}
          disabled={!examVal || !gradeVal || loadingStreamsVal}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingStreamsVal ? "Loading..." : "Stream"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Streams</SelectItem>
            {streamsList.map((stream) => (
              <SelectItem key={stream.id} value={String(stream.id)}>{stream.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={batchVal || "all"}
          onValueChange={(v) => handleFilterChange(batchFilter, v === "all" ? "" : v)}
          disabled={!examVal || !gradeVal || !streamVal || loadingBatchesVal}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingBatchesVal ? "Loading..." : "Batch"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batchesList.map((batch) => (
              <SelectItem key={batch.id} value={String(batch.id)}>{batch.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
            Clear
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="ml-auto size-9"
          onClick={() => setFilterDialogOpen(true)}
        >
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"><Checkbox disabled className="opacity-50" /></TableHead>
                <TableHead>Chapter Code</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead>Access Type</TableHead>
                <TableHead>Micro Lectures</TableHead>
                <TableHead>Mapped</TableHead>
                <TableHead className="w-15">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="size-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="size-8 rounded" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) {
                          (el as HTMLButtonElement).dataset.state = isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')
                        }
                      }}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-brand data-[state=checked]:border-brand data-[state=indeterminate]:bg-brand data-[state=indeterminate]:border-brand"
                    />
                  </TableHead>
                  <TableHead>Chapter Code</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Display Order</TableHead>
                  <TableHead>Access Type</TableHead>
                  <TableHead>Micro Lectures</TableHead>
                  <TableHead>Mapped</TableHead>
                  <TableHead className="w-15">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      No chapters found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((chapter) => (
                    <TableRow key={chapter.chapterId}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(chapter.chapterId)}
                          onCheckedChange={(checked) => handleSelectChapter(chapter.chapterId, checked as boolean)}
                          className="data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{chapter.chapterCode || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{chapter.subject?.displayName || "-"}</TableCell>
                      <TableCell>
                        <p className="font-medium">{chapter.title || chapter.chapterName}</p>
                      </TableCell>
                      <TableCell>
                        {chapter.active ? (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">Yes</span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-950 dark:text-gray-400">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center">{chapter.pos ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{chapter.accessType || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-center">{chapter.microLectureCount ?? chapter.lectureCount ?? 0}</TableCell>
                      <TableCell>
                        {chapter.batchChapters && chapter.batchChapters.length > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">Yes</span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(chapter)}
                              disabled={togglingVal === chapter.chapterId}
                              className="gap-2"
                            >
                              {chapter.active ? (
                                <><ToggleLeft className="size-4" />Make Inactive</>
                              ) : (
                                <><ToggleRight className="size-4" />Make Active</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRowAuditClick(chapter)} className="gap-2">
                              <History className="size-4" />Audit Trail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClick(chapter)} className="gap-2 text-red-600 focus:text-red-600">
                              <Trash2 className="size-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pages > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">showing {data.length} of {total} chapters</p>
                {pages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="flex size-8 items-center justify-center rounded-md border text-sm">{page + 1}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pages - 1}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <AddChapterDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleDialogSuccess} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />Delete Chapter Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete <span className="font-semibold text-foreground">{toDelete?.chapterName || toDelete?.title || toDelete?.chapterCode}</span>?</p>
              <p className="text-red-600 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingVal}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletingVal}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingVal ? 'Deleting...' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuditTrailPopup
        open={auditTrailOpen}
        onClose={() => { setAuditTrailOpen(false); setAuditTrailData([]); setCurrentAuditChapterId(null) }}
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

      <Sheet open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <SheetContent className="w-[50%] p-2 sm:w-[450px]">
          <SheetHeader className='p-0'>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="size-5" />Filter Chapters
            </SheetTitle>
          </SheetHeader>

          <div className="py-6 space-y-5">
            <div className="space-y-2">
              <Label>Chapter Code</Label>
              <Input className='w-[90%]' placeholder="Search by chapter code..." value={chapterCodeVal} onChange={(e) => handleFilterChange(chapterCodeFilter, e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Exam</Label>
              <Select value={examVal || "all"} onValueChange={(v) => handleFilterChange(examFilter, v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select Exam" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {examsList.map((exam) => (<SelectItem key={exam.id} value={String(exam.id)}>{exam.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grade</Label>
              <Select value={gradeVal || "all"} onValueChange={(v) => handleFilterChange(gradeFilter, v === "all" ? "" : v)} disabled={!examVal || loadingGradesVal}>
                <SelectTrigger><SelectValue placeholder={loadingGradesVal ? "Loading..." : "Select Grade"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {gradesList.map((grade) => (<SelectItem key={grade.id} value={String(grade.id)}>{grade.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stream</Label>
              <Select value={streamVal || "all"} onValueChange={(v) => handleFilterChange(streamFilter, v === "all" ? "" : v)} disabled={!examVal || !gradeVal || loadingStreamsVal}>
                <SelectTrigger><SelectValue placeholder={loadingStreamsVal ? "Loading..." : "Select Stream"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  {streamsList.map((stream) => (<SelectItem key={stream.id} value={String(stream.id)}>{stream.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={batchVal || "all"} onValueChange={(v) => handleFilterChange(batchFilter, v === "all" ? "" : v)} disabled={!examVal || !gradeVal || !streamVal || loadingBatchesVal}>
                <SelectTrigger><SelectValue placeholder={loadingBatchesVal ? "Loading..." : "Select Batch"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batchesList.map((batch) => (<SelectItem key={batch.id} value={String(batch.id)}>{batch.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Batch Add-On</Label>
              <Select value={batchAddOnVal || "all"} onValueChange={(v) => handleFilterChange(batchAddOnFilter, v === "all" ? "" : v)} disabled={!batchVal || loadingBatchAddOnsVal}>
                <SelectTrigger><SelectValue placeholder={loadingBatchAddOnsVal ? "Loading..." : "Select Add-On"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Add-Ons</SelectItem>
                  {batchAddOnsList.map((addon) => (<SelectItem key={addon.id} value={String(addon.id)}>{addon.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectVal || "all"} onValueChange={(v) => handleFilterChange(subjectFilter, v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectsList.map((subject) => (<SelectItem key={String(subject.id)} value={String(subject.id)}>{subject.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex py-0 gap-2">
            <Button variant="outline" onClick={handleClearFilters} className="flex-1">Clear All</Button>
            <Button onClick={() => setFilterDialogOpen(false)} className="flex-1">Apply Filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
