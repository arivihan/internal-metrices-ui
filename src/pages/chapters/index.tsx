import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  MoreHorizontal,
  Filter,
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

import { AddChapterDialog } from './AddChapterDialog'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Chapters
          {totalElements > 0 && (
            <span className="ml-2 text-muted-foreground">({totalElements})</span>
          )}
        </h1>
        <div className="flex items-center gap-3">
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
          onChange={(e) => handleFilterChange(setChapterCodeFilter, e.target.value)}
          className="w-40"
        />

        {/* Exam Filter */}
        <Select
          value={examFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setExamFilter, v === 'all' ? '' : v)}
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
          value={gradeFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setGradeFilter, v === 'all' ? '' : v)}
          disabled={!examFilter || loadingGrades}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingGrades ? 'Loading...' : 'Grade'} />
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
          value={streamFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setStreamFilter, v === 'all' ? '' : v)}
          disabled={!examFilter || !gradeFilter || loadingStreams}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingStreams ? 'Loading...' : 'Stream'} />
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
          value={batchFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setBatchFilter, v === 'all' ? '' : v)}
          disabled={!examFilter || !gradeFilter || !streamFilter || loadingBatches}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingBatches ? 'Loading...' : 'Batch'} />
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

        {/* Batch Add-On Filter (depends on Batch) */}
        <Select
          value={batchAddOnFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setBatchAddOnFilter, v === 'all' ? '' : v)}
          disabled={!batchFilter || loadingBatchAddOns}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder={loadingBatchAddOns ? 'Loading...' : 'Batch Add-On'} />
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

        {/* Subject Filter (independent) */}
        <Select
          value={subjectFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setSubjectFilter, v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Subject" />
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

        <Button variant="outline" size="icon" className="ml-auto size-9">
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
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
                  <TableHead className="w-12"></TableHead>
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
                        <Checkbox className="data-[state=checked]:bg-brand data-[state=checked]:border-brand" />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {chapter.chapterCode || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {chapter.subject?.displayName || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{chapter.title || chapter.chapterName}</p>
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
                        {chapter.pos ?? '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {chapter.accessType || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center">
                        {chapter.microLectureCount ?? chapter.lectureCount ?? 0}
                      </TableCell>
                      <TableCell>
                        {chapter.batchChapters && chapter.batchChapters.length > 0 ? (
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
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
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
                  Total {totalElements} items
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
    </div>
  )
}
