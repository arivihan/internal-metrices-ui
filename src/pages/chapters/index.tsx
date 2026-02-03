import { useEffect, useState } from 'react'
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
  // Chapter APIs
  fetchChapters,
  // Exam API
  fetchExams,
  // Exam-Grade mapping API (grades linked to exam)
  fetchGradesByExam,
  // Exam-Grade-Stream mapping API (streams linked to exam+grade)
  fetchStreamsByExamGrade,
  // Batch API (batches linked to exam+grade+stream)
  fetchBatches,
  // Batch Add-On API (add-ons linked to batch)
  fetchBatchAddOns,
  // Subject API
  fetchSubjects,
  // Audit Trail APIs
  fetchChapterAuditTrail,
  fetchChaptersTableAuditTrail,
} from '@/services/chapters'
import type { ChapterDto, FilterOption } from '@/types/chapters'

export default function Chapters() {
  // Data states
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChapterDto[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 20

  // Filter options (dropdown data)
  const [exams, setExams] = useState<FilterOption[]>([])
  const [grades, setGrades] = useState<FilterOption[]>([])
  const [streams, setStreams] = useState<FilterOption[]>([])
  const [batches, setBatches] = useState<FilterOption[]>([])
  const [batchAddOns, setBatchAddOns] = useState<FilterOption[]>([])
  const [subjects, setSubjects] = useState<FilterOption[]>([])

  // Filter values (selected IDs)
  const [examFilter, setExamFilter] = useState<string>('')
  const [gradeFilter, setGradeFilter] = useState<string>('')
  const [streamFilter, setStreamFilter] = useState<string>('')
  const [batchFilter, setBatchFilter] = useState<string>('')
  const [batchAddOnFilter, setBatchAddOnFilter] = useState<string>('')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [chapterCodeFilter, setChapterCodeFilter] = useState<string>('')

  // Loading states for cascading dropdowns
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [loadingStreams, setLoadingStreams] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingBatchAddOns, setLoadingBatchAddOns] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chapterToDelete, setChapterToDelete] = useState<ChapterDto | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState<number | null>(null)

  // Selected chapters for mapping
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set())

  // Mapping view state
  const [showMappingView, setShowMappingView] = useState(false)
  const [mappingDisplayOrders, setMappingDisplayOrders] = useState<Record<number, number>>({})
  const [isSavingMapping, setIsSavingMapping] = useState(false)

  // Mapping filters (separate from table filters)
  const [mappingExamFilter, setMappingExamFilter] = useState<string>('')
  const [mappingGradeFilter, setMappingGradeFilter] = useState<string>('')
  const [mappingStreamFilter, setMappingStreamFilter] = useState<string>('')
  const [mappingBatchFilter, setMappingBatchFilter] = useState<string>('')
  const [mappingBatchAddOnFilter, setMappingBatchAddOnFilter] = useState<string>('')

  // Mapping filter options
  const [mappingGrades, setMappingGrades] = useState<FilterOption[]>([])
  const [mappingStreams, setMappingStreams] = useState<FilterOption[]>([])
  const [mappingBatches, setMappingBatches] = useState<FilterOption[]>([])
  const [mappingBatchAddOns, setMappingBatchAddOns] = useState<FilterOption[]>([])

  // Loading states for mapping dropdowns
  const [loadingMappingGrades, setLoadingMappingGrades] = useState(false)
  const [loadingMappingStreams, setLoadingMappingStreams] = useState(false)
  const [loadingMappingBatches, setLoadingMappingBatches] = useState(false)
  const [loadingMappingBatchAddOns, setLoadingMappingBatchAddOns] = useState(false)

  // Audit Trail state
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
  const [currentAuditChapterId, setCurrentAuditChapterId] = useState<number | null>(null)
  const [isTableAudit, setIsTableAudit] = useState(false)

  // Filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  // Helper to get code from id
  const getCode = (items: FilterOption[], id: string): string | undefined => {
    const item = items.find(i => String(i.id) === id)
    return item?.code || undefined
  }

  // ============================================================================
  // Load initial filter options (Exams, Subjects)
  // ============================================================================
  useEffect(() => {
    loadInitialFilters()
  }, [])

  const loadInitialFilters = async () => {
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        fetchExams({ active: true }),
        fetchSubjects({ active: true }),
      ])
      setExams(examsRes.content)
      setSubjects(subjectsRes.content)
    } catch (error) {
      console.error('Failed to load filter options:', error)
      toast.error('Failed to load filter options')
    }
  }

  // ============================================================================
  // Cascading: When Exam changes → Load Grades linked to that Exam
  // ============================================================================
  useEffect(() => {
    if (examFilter) {
      loadGradesByExam()
    } else {
      // Clear all dependent filters
      setGrades([])
      setGradeFilter('')
      setStreams([])
      setStreamFilter('')
      setBatches([])
      setBatchFilter('')
      setBatchAddOns([])
      setBatchAddOnFilter('')
    }
  }, [examFilter])

  const loadGradesByExam = async () => {
    if (!examFilter) return

    setLoadingGrades(true)
    try {
      const response = await fetchGradesByExam({
        examId: Number(examFilter),
      })
      setGrades(response.content)
    } catch (error) {
      console.error('Failed to load grades:', error)
      toast.error('Failed to load grades')
      setGrades([])
    } finally {
      setLoadingGrades(false)
    }
  }

  // ============================================================================
  // Cascading: When Grade changes → Load Streams linked to Exam+Grade
  // ============================================================================
  useEffect(() => {
    if (examFilter && gradeFilter) {
      loadStreamsByExamGrade()
    } else {
      setStreams([])
      setStreamFilter('')
      setBatches([])
      setBatchFilter('')
      setBatchAddOns([])
      setBatchAddOnFilter('')
    }
  }, [gradeFilter])

  const loadStreamsByExamGrade = async () => {
    if (!examFilter || !gradeFilter) return

    setLoadingStreams(true)
    try {
      const response = await fetchStreamsByExamGrade({
        examId: Number(examFilter),
        gradeId: Number(gradeFilter),
      })
      setStreams(response.content)
    } catch (error) {
      console.error('Failed to load streams:', error)
      toast.error('Failed to load streams')
      setStreams([])
    } finally {
      setLoadingStreams(false)
    }
  }

  // ============================================================================
  // Cascading: When Stream changes → Load Batches linked to Exam+Grade+Stream
  // ============================================================================
  useEffect(() => {
    if (examFilter && gradeFilter && streamFilter) {
      loadBatches()
    } else {
      setBatches([])
      setBatchFilter('')
      setBatchAddOns([])
      setBatchAddOnFilter('')
    }
  }, [streamFilter])

  const loadBatches = async () => {
    if (!examFilter || !gradeFilter || !streamFilter) return

    setLoadingBatches(true)
    try {
      const response = await fetchBatches({
        examId: Number(examFilter),
        gradeId: Number(gradeFilter),
        streamId: Number(streamFilter),
        activeFlag: true,
      })
      setBatches(response.content)
    } catch (error) {
      console.error('Failed to load batches:', error)
      toast.error('Failed to load batches')
      setBatches([])
    } finally {
      setLoadingBatches(false)
    }
  }

  // ============================================================================
  // Cascading: When Batch changes → Load Batch Add-Ons linked to Batch
  // ============================================================================
  useEffect(() => {
    if (batchFilter) {
      loadBatchAddOns()
    } else {
      setBatchAddOns([])
      setBatchAddOnFilter('')
    }
  }, [batchFilter])

  const loadBatchAddOns = async () => {
    if (!batchFilter) return

    setLoadingBatchAddOns(true)
    try {
      const response = await fetchBatchAddOns({
        batchId: Number(batchFilter),
      })
      setBatchAddOns(response.content)
    } catch (error) {
      console.error('Failed to load batch add-ons:', error)
      setBatchAddOns([])
    } finally {
      setLoadingBatchAddOns(false)
    }
  }

  // ============================================================================
  // Load chapters when any filter changes
  // ============================================================================
  useEffect(() => {
    loadChapters()
  }, [page, examFilter, gradeFilter, streamFilter, batchFilter, batchAddOnFilter, subjectFilter, chapterCodeFilter])

  const loadChapters = async () => {
    setLoading(true)
    try {
      // Get codes from IDs for the chapter API
      const examCode = getCode(exams, examFilter)
      const gradeCode = getCode(grades, gradeFilter)
      const streamCode = getCode(streams, streamFilter)
      const batchCode = getCode(batches, batchFilter)
      const batchAddOnCode = getCode(batchAddOns, batchAddOnFilter)
      const subjectCode = getCode(subjects, subjectFilter)

      const response = await fetchChapters({
        page,
        size: pageSize,
        examCode: examCode || undefined,
        gradeCode: gradeCode || undefined,
        streamCode: streamCode || undefined,
        batchCode: batchCode || undefined,
        batchAddOnCode: batchAddOnCode || undefined,
        subjectCode: subjectCode || undefined,
        search: chapterCodeFilter || undefined,
        active: true,
      })

      setData(response.content || [])
      setTotalPages(response.totalPages || 0)
      setTotalElements(response.totalElements || 0)
    } catch (error: any) {
      console.error('Failed to load chapters:', error)
      const errorMessage = error?.message || 'Failed to load chapters'
      toast.error(errorMessage)
      setData([])
      setTotalPages(0)
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // Filter change handlers
  // ============================================================================
  const handleFilterChange = <T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T
  ) => {
    setter(value)
    setPage(0)
  }

  const handleAddChapter = () => {
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    loadChapters()
  }

  // Handle delete chapter (hard delete)
  const handleDeleteClick = (chapter: ChapterDto) => {
    setChapterToDelete(chapter)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!chapterToDelete) return

    setIsDeleting(true)
    try {
      const { dynamicRequest } = await import('@/services/apiClient')
      await dynamicRequest(
        `/secure/api/v1/chapter/${chapterToDelete.chapterId}/delete`,
        'DELETE'
      )
      toast.success('Chapter deleted successfully')
      setDeleteDialogOpen(false)
      setChapterToDelete(null)
      loadChapters()
    } catch (error: any) {
      console.error('Failed to delete chapter:', error)
      toast.error(error?.message || 'Failed to delete chapter')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle toggle active/inactive status
  const handleToggleStatus = async (chapter: ChapterDto) => {
  setIsTogglingStatus(Number(chapter.chapterId))
    try {
      const { dynamicRequest } = await import('@/services/apiClient')
      // Toggle: if currently active, set to inactive (false), and vice versa
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
      setIsTogglingStatus(null)
    }
  }

  // ============================================================================
  // Chapter selection handlers
  // ============================================================================
  const handleSelectChapter = (chapterId: number, checked: boolean) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(chapterId)
      } else {
        newSet.delete(chapterId)
      }
      return newSet
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedChapters(new Set(data.map(c => Number(c.chapterId))))
    } else {
      setSelectedChapters(new Set())
    }
  }

  const isAllSelected = data.length > 0 && selectedChapters.size === data.length
  const isSomeSelected = selectedChapters.size > 0 && selectedChapters.size < data.length

  // ============================================================================
  // Mapping view handlers
  // ============================================================================
  const handleOpenMappingView = () => {
    // Initialize display orders from selected chapters
    const orders: Record<number, number> = {}
    data.filter(c => selectedChapters.has(Number(c.chapterId))).forEach((chapter, idx) => {
      orders[Number(chapter.chapterId)] = chapter.pos ?? (idx + 1)
    })
    setMappingDisplayOrders(orders)
    setShowMappingView(true)
  }

  const handleCloseMappingView = () => {
    setShowMappingView(false)
    setMappingExamFilter('')
    setMappingGradeFilter('')
    setMappingStreamFilter('')
    setMappingBatchFilter('')
    setMappingBatchAddOnFilter('')
    setMappingGrades([])
    setMappingStreams([])
    setMappingBatches([])
    setMappingBatchAddOns([])
  }

  const handleDisplayOrderChange = (chapterId: number, value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setMappingDisplayOrders(prev => ({
        ...prev,
        [chapterId]: numValue
      }))
    }
  }

  // Mapping cascading filters
  const loadMappingGrades = async (examId: string) => {
    if (!examId) {
      setMappingGrades([])
      return
    }
    setLoadingMappingGrades(true)
    try {
      const response = await fetchGradesByExam({ examId: Number(examId) })
      setMappingGrades(response.content)
    } catch (error) {
      console.error('Failed to load mapping grades:', error)
      setMappingGrades([])
    } finally {
      setLoadingMappingGrades(false)
    }
  }

  const loadMappingStreams = async (examId: string, gradeId: string) => {
    if (!examId || !gradeId) {
      setMappingStreams([])
      return
    }
    setLoadingMappingStreams(true)
    try {
      const response = await fetchStreamsByExamGrade({
        examId: Number(examId),
        gradeId: Number(gradeId),
      })
      setMappingStreams(response.content)
    } catch (error) {
      console.error('Failed to load mapping streams:', error)
      setMappingStreams([])
    } finally {
      setLoadingMappingStreams(false)
    }
  }

  const loadMappingBatches = async (examId: string, gradeId: string, streamId: string) => {
    if (!examId || !gradeId || !streamId) {
      setMappingBatches([])
      return
    }
    setLoadingMappingBatches(true)
    try {
      const response = await fetchBatches({
        examId: Number(examId),
        gradeId: Number(gradeId),
        streamId: Number(streamId),
        activeFlag: true,
      })
      setMappingBatches(response.content)
    } catch (error) {
      console.error('Failed to load mapping batches:', error)
      setMappingBatches([])
    } finally {
      setLoadingMappingBatches(false)
    }
  }

  const loadMappingBatchAddOns = async (batchId: string) => {
    if (!batchId) {
      setMappingBatchAddOns([])
      return
    }
    setLoadingMappingBatchAddOns(true)
    try {
      const response = await fetchBatchAddOns({ batchId: Number(batchId) })
      setMappingBatchAddOns(response.content)
    } catch (error) {
      console.error('Failed to load mapping batch add-ons:', error)
      setMappingBatchAddOns([])
    } finally {
      setLoadingMappingBatchAddOns(false)
    }
  }

  // Handle mapping filter changes
  const handleMappingExamChange = (value: string) => {
    setMappingExamFilter(value === 'all' ? '' : value)
    setMappingGradeFilter('')
    setMappingStreamFilter('')
    setMappingBatchFilter('')
    setMappingBatchAddOnFilter('')
    setMappingGrades([])
    setMappingStreams([])
    setMappingBatches([])
    setMappingBatchAddOns([])
    if (value && value !== 'all') {
      loadMappingGrades(value)
    }
  }

  const handleMappingGradeChange = (value: string) => {
    setMappingGradeFilter(value === 'all' ? '' : value)
    setMappingStreamFilter('')
    setMappingBatchFilter('')
    setMappingBatchAddOnFilter('')
    setMappingStreams([])
    setMappingBatches([])
    setMappingBatchAddOns([])
    if (value && value !== 'all' && mappingExamFilter) {
      loadMappingStreams(mappingExamFilter, value)
    }
  }

  const handleMappingStreamChange = (value: string) => {
    setMappingStreamFilter(value === 'all' ? '' : value)
    setMappingBatchFilter('')
    setMappingBatchAddOnFilter('')
    setMappingBatches([])
    setMappingBatchAddOns([])
    if (value && value !== 'all' && mappingExamFilter && mappingGradeFilter) {
      loadMappingBatches(mappingExamFilter, mappingGradeFilter, value)
    }
  }

  const handleMappingBatchChange = (value: string) => {
    setMappingBatchFilter(value === 'all' ? '' : value)
    setMappingBatchAddOnFilter('')
    setMappingBatchAddOns([])
    if (value && value !== 'all') {
      loadMappingBatchAddOns(value)
    }
  }

  // Save mapping
  const handleSaveMapping = async () => {
    if (!mappingBatchFilter) {
      toast.error('Please select a batch')
      return
    }

    const chaptersToMap = Array.from(selectedChapters).map(chapterId => ({
      chapterId: String(chapterId),
      displayOrder: mappingDisplayOrders[chapterId] ?? 0,
    }))

    if (chaptersToMap.length === 0) {
      toast.error('No chapters selected')
      return
    }

    setIsSavingMapping(true)
    try {
      const { dynamicRequest } = await import('@/services/apiClient')

      // Build URL with query params
      let url = `/secure/api/v1/chapter-mappings?batchId=${mappingBatchFilter}`
      if (mappingBatchAddOnFilter) {
        url += `&batchAddonId=${mappingBatchAddOnFilter}`
      }

      await dynamicRequest(url, 'POST', chaptersToMap)

      toast.success('Chapters mapped successfully')
      handleCloseMappingView()
      setSelectedChapters(new Set())
      loadChapters()
    } catch (error: any) {
      console.error('Failed to save mapping:', error)
      toast.error(error?.message || 'Failed to save mapping')
    } finally {
      setIsSavingMapping(false)
    }
  }

  // ============================================================================
  // Audit Trail handlers
  // ============================================================================
  const fetchAuditTrailPage = async (
    chapterId: number | null,
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
  setCurrentAuditChapterId(Number(chapter.chapterId))
    setIsTableAudit(false)
    setAuditTrailTitle(`Audit Trail - ${chapter.title || chapter.chapterName || chapter.chapterCode}`)
    setAuditTrailOpen(true)
  await fetchAuditTrailPage(Number(chapter.chapterId), 0, false)
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
    examFilter ||
    gradeFilter ||
    streamFilter ||
    batchFilter ||
    batchAddOnFilter ||
    subjectFilter ||
    chapterCodeFilter

  const clearFilters = () => {
    setExamFilter('')
    setGradeFilter('')
    setStreamFilter('')
    setBatchFilter('')
    setBatchAddOnFilter('')
    setSubjectFilter('')
    setChapterCodeFilter('')
    setPage(0)
  }

  // If mapping view is open, show full-width mapping UI
  if (showMappingView) {
  const selectedChaptersList = data.filter(c => selectedChapters.has(Number(c.chapterId)))

    return (
      <div className="space-y-6">
        {/* Mapping Header */}
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
            disabled={isSavingMapping || !mappingBatchFilter}
            className="gap-2"
          >
            <Save className="size-4" />
            {isSavingMapping ? 'Saving...' : 'Save Mapping'}
          </Button>
        </div>

        {/* Mapping Content - Split View */}
        <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Selected Chapters with Display Order */}
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
                      value={mappingDisplayOrders[chapter.chapterId] ?? 0}
                      onChange={(e) => handleDisplayOrderChange(Number(chapter.chapterId), e.target.value)}
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
              {/* Exam */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Exam *</label>
                <Select
                  value={mappingExamFilter || "all"}
                  onValueChange={handleMappingExamChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Exam</SelectItem>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={String(exam.id)}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Grade *</label>
                <Select
                  value={mappingGradeFilter || "all"}
                  onValueChange={handleMappingGradeChange}
                  disabled={!mappingExamFilter || loadingMappingGrades}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMappingGrades ? "Loading..." : "Select Grade"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Grade</SelectItem>
                    {mappingGrades.map((grade) => (
                      <SelectItem key={grade.id} value={String(grade.id)}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stream */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Stream *</label>
                <Select
                  value={mappingStreamFilter || "all"}
                  onValueChange={handleMappingStreamChange}
                  disabled={!mappingGradeFilter || loadingMappingStreams}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMappingStreams ? "Loading..." : "Select Stream"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Stream</SelectItem>
                    {mappingStreams.map((stream) => (
                      <SelectItem key={stream.id} value={String(stream.id)}>
                        {stream.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch *</label>
                <Select
                  value={mappingBatchFilter || "all"}
                  onValueChange={handleMappingBatchChange}
                  disabled={!mappingStreamFilter || loadingMappingBatches}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMappingBatches ? "Loading..." : "Select Batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Select Batch</SelectItem>
                    {mappingBatches.map((batch) => (
                      <SelectItem key={batch.id} value={String(batch.id)}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch Add-On (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Add-On (Optional)</label>
                <Select
                  value={mappingBatchAddOnFilter || "all"}
                  onValueChange={(v) => setMappingBatchAddOnFilter(v === "all" ? "" : v)}
                  disabled={!mappingBatchFilter || loadingMappingBatchAddOns}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMappingBatchAddOns ? "Loading..." : "Select Add-On"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No Add-On</SelectItem>
                    {mappingBatchAddOns.map((addon) => (
                      <SelectItem key={addon.id} value={String(addon.id)}>
                        {addon.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Validation message */}
              {!mappingBatchFilter && (
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
          {totalElements > 0 && (
            <span className="ml-2 text-muted-foreground">
              ({totalElements})
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          {selectedChapters.size > 0 && (
            <Button
              variant="default"
              onClick={handleOpenMappingView}
              className="gap-2"
            >
              <Link2 className="size-4" />
              Create Mapping ({selectedChapters.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleTableAuditClick}
            className="gap-2"
          >
            <History className="size-4" />
            Table Audit
          </Button>
          <Button
            variant="outline"
            onClick={handleAddChapter}
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
          value={chapterCodeFilter}
          onChange={(e) =>
            handleFilterChange(setChapterCodeFilter, e.target.value)
          }
          className="w-40"
        />

        {/* Exam Filter */}
        <Select
          value={examFilter || "all"}
          onValueChange={(v) =>
            handleFilterChange(setExamFilter, v === "all" ? "" : v)
          }
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams.map((exam) => (
              <SelectItem key={exam.id} value={String(exam.id)}>
                {exam.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade Filter (depends on Exam) */}
        <Select
          value={gradeFilter || "all"}
          onValueChange={(v) =>
            handleFilterChange(setGradeFilter, v === "all" ? "" : v)
          }
          disabled={!examFilter || loadingGrades}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingGrades ? "Loading..." : "Grade"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade.id} value={String(grade.id)}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stream Filter (depends on Exam + Grade) */}
        <Select
          value={streamFilter || "all"}
          onValueChange={(v) =>
            handleFilterChange(setStreamFilter, v === "all" ? "" : v)
          }
          disabled={!examFilter || !gradeFilter || loadingStreams}
        >
          <SelectTrigger className="w-35">
            <SelectValue
              placeholder={loadingStreams ? "Loading..." : "Stream"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Streams</SelectItem>
            {streams.map((stream) => (
              <SelectItem key={stream.id} value={String(stream.id)}>
                {stream.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Batch Filter (depends on Exam + Grade + Stream) */}
        <Select
          value={batchFilter || "all"}
          onValueChange={(v) =>
            handleFilterChange(setBatchFilter, v === "all" ? "" : v)
          }
          disabled={
            !examFilter || !gradeFilter || !streamFilter || loadingBatches
          }
        >
          <SelectTrigger className="w-35">
            <SelectValue
              placeholder={loadingBatches ? "Loading..." : "Batch"}
            />
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
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
                <TableHead className="w-12">
                  <Checkbox disabled className="opacity-50" />
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
              {[...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="size-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="size-8 rounded" />
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
                    <TableCell
                      colSpan={10}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No chapters found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((chapter) => (
                    <TableRow key={chapter.chapterId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedChapters.has(Number(chapter.chapterId))}
                          onCheckedChange={(checked) => handleSelectChapter(Number(chapter.chapterId), checked as boolean)}
                          className="data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {chapter.chapterCode || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {chapter.subject?.displayName || "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {chapter.title || chapter.chapterName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {chapter.active ? (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-950 dark:text-gray-400">
                            No
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center">
                        {chapter.pos ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {chapter.accessType || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center">
                        {chapter.microLectureCount ?? chapter.lectureCount ?? 0}
                      </TableCell>
                      <TableCell>
                        {chapter.batchChapters &&
                        chapter.batchChapters.length > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                            No
                          </span>
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
                              disabled={isTogglingStatus === Number(chapter.chapterId)}
                              className="gap-2"
                            >
                              {chapter.active ? (
                                <>
                                  <ToggleLeft className="size-4" />
                                  Make Inactive
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="size-4" />
                                  Make Active
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRowAuditClick(chapter)}
                              className="gap-2"
                            >
                              <History className="size-4" />
                              Audit Trail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(chapter)}
                              className="gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="size-4" />
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

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  showing {data.length} of {totalElements} chapters
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="flex size-8 items-center justify-center rounded-md border text-sm">
                      {page + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
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

      {/* Add Chapter Dialog */}
      <AddChapterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              Delete Chapter Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">
                  {chapterToDelete?.chapterName || chapterToDelete?.title || chapterToDelete?.chapterCode}
                </span>
                ?
              </p>
              <p className="text-red-600 font-medium">
                This action cannot be undone. The chapter will be permanently removed and you will not be able to recover it.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Trail Popup */}
      <AuditTrailPopup
        open={auditTrailOpen}
        onClose={() => {
          setAuditTrailOpen(false)
          setAuditTrailData([])
          setCurrentAuditChapterId(null)
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

      {/* Filter Sheet */}
      <Sheet open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <SheetContent className="w-[50%] p-2  sm:w-[450px]">
          <SheetHeader className=' p-0'>
            <SheetTitle className="flex  items-center gap-2">
              <Filter className="size-5" />
              Filter Chapters
            </SheetTitle>
          </SheetHeader>

          <div className="py-6  space-y-5">
            {/* Chapter Code */}
            <div className="space-y-2">
              <Label>Chapter Code</Label>
              <Input
              className='w-[90%]'
                placeholder="Search by chapter code..."
                value={chapterCodeFilter}
                onChange={(e) => handleFilterChange(setChapterCodeFilter, e.target.value)}
              />
            </div>

            {/* Exam Filter */}
            <div className="space-y-2">
              <Label>Exam</Label>
              <Select
                value={examFilter || "all"}
                onValueChange={(v) => handleFilterChange(setExamFilter, v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Exams</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {exam.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade Filter */}
            <div className="space-y-2">
              <Label>Grade</Label>
              <Select
                value={gradeFilter || "all"}
                onValueChange={(v) => handleFilterChange(setGradeFilter, v === "all" ? "" : v)}
                disabled={!examFilter || loadingGrades}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingGrades ? "Loading..." : "Select Grade"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={String(grade.id)}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stream Filter */}
            <div className="space-y-2">
              <Label>Stream</Label>
              <Select
                value={streamFilter || "all"}
                onValueChange={(v) => handleFilterChange(setStreamFilter, v === "all" ? "" : v)}
                disabled={!examFilter || !gradeFilter || loadingStreams}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingStreams ? "Loading..." : "Select Stream"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Streams</SelectItem>
                  {streams.map((stream) => (
                    <SelectItem key={stream.id} value={String(stream.id)}>
                      {stream.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Filter */}
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select
                value={batchFilter || "all"}
                onValueChange={(v) => handleFilterChange(setBatchFilter, v === "all" ? "" : v)}
                disabled={!examFilter || !gradeFilter || !streamFilter || loadingBatches}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingBatches ? "Loading..." : "Select Batch"} />
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
            </div>

            {/* Batch Add-On Filter */}
            <div className="space-y-2">
              <Label>Batch Add-On</Label>
              <Select
                value={batchAddOnFilter || "all"}
                onValueChange={(v) => handleFilterChange(setBatchAddOnFilter, v === "all" ? "" : v)}
                disabled={!batchFilter || loadingBatchAddOns}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingBatchAddOns ? "Loading..." : "Select Add-On"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Add-Ons</SelectItem>
                  {batchAddOns.map((addon) => (
                    <SelectItem key={addon.id} value={String(addon.id)}>
                      {addon.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={subjectFilter || "all"}
                onValueChange={(v) => handleFilterChange(setSubjectFilter, v === "all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={String(subject.id)} value={String(subject.id)}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex  py-0 gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setFilterDialogOpen(false)}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
