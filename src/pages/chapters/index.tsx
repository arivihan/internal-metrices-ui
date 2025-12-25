import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  MoreHorizontal,
  AlertTriangle,
  Filter,
} from 'lucide-react'

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

import { AddChapterDialog } from './AddChapterDialog'
import type { Chapter, ChapterPaginatedResponse, FilterOption } from '@/types/chapters'

// Placeholder data - replace with API calls when backend is ready
const PLACEHOLDER_CHAPTERS: Chapter[] = [
  { id: '1', chapterName: 'Electrostatics L1', subject: 'Mathematics', subjectId: 's1', language: 'Hindi', isMapped: true },
  { id: '2', chapterName: 'Nature and Significance of Management', subject: 'Biology', subjectId: 's2', language: 'English', isMapped: true },
  { id: '3', chapterName: 'Principles of Management', subject: 'Chemistry', subjectId: 's3', language: 'Hindi', isMapped: true },
  { id: '4', chapterName: 'Consumer Protection', subject: 'Physics', subjectId: 's4', language: 'English', isMapped: false },
  { id: '5', chapterName: 'Business Environment', subject: 'Physics', subjectId: 's4', language: 'Hindi', isMapped: true },
  { id: '6', chapterName: 'Business Finance', subject: 'Mathematics', subjectId: 's1', language: 'Hindi', isMapped: true },
  { id: '7', chapterName: 'Marketing', subject: 'Mathematics', subjectId: 's1', language: 'Hindi', isMapped: false },
  { id: '8', chapterName: 'Controlling', subject: 'Physics', subjectId: 's4', language: 'English', isMapped: false },
  { id: '9', chapterName: 'Principles and Functions of Management', subject: 'Biology', subjectId: 's2', language: 'Hindi', isMapped: true },
  { id: '10', chapterName: 'Financial Markets', subject: 'Economics', subjectId: 's5', language: 'English', isMapped: true },
]

const PLACEHOLDER_EXAMS: FilterOption[] = [
  { id: 'e1', name: 'MP Board' },
  { id: 'e2', name: 'RBSE' },
  { id: 'e3', name: 'UP Board' },
  { id: 'e4', name: 'NEET' },
]

const PLACEHOLDER_COURSES: FilterOption[] = [
  { id: 'c1', name: 'PCM' },
  { id: 'c2', name: 'PCB' },
  { id: 'c3', name: 'PCMB' },
  { id: 'c4', name: 'Commerce' },
  { id: 'c5', name: 'Arts' },
]

const PLACEHOLDER_SUBJECTS: FilterOption[] = [
  { id: 's1', name: 'Mathematics' },
  { id: 's2', name: 'Physics' },
  { id: 's3', name: 'Biology' },
  { id: 's4', name: 'Chemistry' },
  { id: 's5', name: 'Economics' },
  { id: 's6', name: 'Political Science' },
  { id: 's7', name: 'Sociology' },
  { id: 's8', name: 'Hindi' },
  { id: 's9', name: 'English' },
  { id: 's10', name: 'Geography' },
]

export default function Chapters() {
  // Data states
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChapterPaginatedResponse | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Filter options (using placeholder data)
  const [courses] = useState<FilterOption[]>(PLACEHOLDER_COURSES)
  const [subjects] = useState<FilterOption[]>(PLACEHOLDER_SUBJECTS)
  const [exams] = useState<FilterOption[]>(PLACEHOLDER_EXAMS)

  // Filter values
  const [courseFilter, setCourseFilter] = useState<string>('')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [chapterFilter, setChapterFilter] = useState<string>('')
  const [languageFilter, setLanguageFilter] = useState<string>('')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)

  // Load chapters with placeholder data
  useEffect(() => {
    // Simulate loading delay
    setLoading(true)
    const timer = setTimeout(() => {
      // Filter placeholder data based on filters
      let filtered = [...PLACEHOLDER_CHAPTERS]

      if (subjectFilter) {
        filtered = filtered.filter(c => c.subjectId === subjectFilter)
      }
      if (languageFilter) {
        filtered = filtered.filter(c => c.language === languageFilter)
      }
      if (chapterFilter) {
        filtered = filtered.filter(c => c.id === chapterFilter)
      }

      // Paginate
      const start = page * pageSize
      const paginatedContent = filtered.slice(start, start + pageSize)

      setData({
        content: paginatedContent,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
        size: pageSize,
        number: page,
      })
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [page, courseFilter, subjectFilter, chapterFilter, languageFilter])

  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value === 'all' ? '' : value)
    setPage(0)
  }

  const handleAddChapter = () => {
    setEditingChapter(null)
    setDialogOpen(true)
  }

  const handleMapChapter = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    // Refresh the list
    setPage(0)
  }

  const hasActiveFilters = courseFilter || subjectFilter || chapterFilter || languageFilter

  const clearFilters = () => {
    setCourseFilter('')
    setSubjectFilter('')
    setChapterFilter('')
    setLanguageFilter('')
    setPage(0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Chapters
          {data && (
            <span className="ml-2 text-muted-foreground">
              ({data.totalElements})
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled>
            <Upload className="mr-2 size-4" />
            Bulk Upload
          </Button>
          <Button
            variant="outline"
            onClick={handleAddChapter}
            className="gap-2 border-brand/50 text-brand hover:bg-brand/10"
          >
            <Plus className="size-4" />
            Add Chapter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={courseFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setCourseFilter, v)}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={subjectFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setSubjectFilter, v)}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={chapterFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setChapterFilter, v)}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Chapter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            {data?.content.map((chapter) => (
              <SelectItem key={chapter.id} value={chapter.id}>
                {chapter.chapterName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={languageFilter || 'all'}
          onValueChange={(v) => handleFilterChange(setLanguageFilter, v)}
        >
          <SelectTrigger className="w-35">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="Hindi">Hindi</SelectItem>
            <SelectItem value="English">English</SelectItem>
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
                <TableHead>Chapter</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-15"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="size-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
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
                  <TableHead>Chapter</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-15">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.content.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No chapters found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.content.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell>
                        <Checkbox className="data-[state=checked]:bg-brand data-[state=checked]:border-brand" />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{chapter.chapterName}</p>
                          {!chapter.isMapped && (
                            <p className="flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="size-3" />
                              Chapter not mapped to any course
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {chapter.subject}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {chapter.language}
                      </TableCell>
                      <TableCell>
                        {chapter.isMapped ? (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                            Mapped
                          </span>
                        ) : (
                          <button
                            onClick={() => handleMapChapter(chapter)}
                            className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                          >
                            Map Now
                          </button>
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
            {data && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Total {data.totalElements} items
                </p>
                {data.totalPages > 1 && (
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
                      disabled={page >= data.totalPages - 1}
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

      {/* Add/Edit Chapter Dialog */}
      <AddChapterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        editingChapter={editingChapter}
        exams={exams}
        courses={courses}
        subjects={subjects}
      />
    </div>
  )
}
