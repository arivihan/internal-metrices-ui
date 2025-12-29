import { useState, useRef, useEffect } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { addChapter, mapChapter } from '@/services/chapters'
import type { Chapter, FilterOption } from '@/types/chapters'

interface AddChapterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingChapter?: Chapter | null
  exams: FilterOption[]
  courses: FilterOption[]
  subjects: FilterOption[]
}

interface FormData {
  chapterName: string
  examIds: string[]
  courseIds: string[]
  subjectIds: string[]
  language: 'Hindi' | 'English'
  videoFile: File | null
}

export function AddChapterDialog({
  open,
  onOpenChange,
  onSuccess,
  editingChapter,
  exams,
  courses,
  subjects,
}: AddChapterDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    chapterName: '',
    examIds: [],
    courseIds: [],
    subjectIds: [],
    language: 'Hindi',
    videoFile: null,
  })

  const isEditMode = !!editingChapter

  // Reset form when sheet opens or editing chapter changes
  useEffect(() => {
    if (open) {
      setFormData({
        chapterName: editingChapter?.chapterName || '',
        examIds: editingChapter?.examIds || [],
        courseIds: editingChapter?.courseIds || [],
        subjectIds: editingChapter?.subjectId ? [editingChapter.subjectId] : [],
        language: editingChapter?.language || 'Hindi',
        videoFile: null,
      })
    }
  }, [open, editingChapter])

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid video file (mp4, mov, avi)')
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size must be less than 15MB')
        return
      }
      setFormData((prev) => ({ ...prev, videoFile: file }))
    }
  }

  const handleDropzoneClick = () => {
    fileInputRef.current?.click()
  }

  const toggleArrayValue = (
    field: 'examIds' | 'courseIds' | 'subjectIds',
    value: string
  ) => {
    setFormData((prev) => {
      const arr = prev[field]
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter((v) => v !== value) }
      } else {
        return { ...prev, [field]: [...arr, value] }
      }
    })
  }

  const handleSubmit = async () => {
    if (!formData.chapterName.trim()) {
      toast.error('Chapter name is required')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && editingChapter) {
        await mapChapter({
          chapterId: editingChapter.id,
          examIds: formData.examIds,
          courseIds: formData.courseIds,
          subjectIds: formData.subjectIds,
          language: formData.language,
        })
        toast.success('Chapter mapped successfully')
      } else {
        await addChapter({
          chapterName: formData.chapterName,
          examIds: formData.examIds,
          courseIds: formData.courseIds,
          subjectIds: formData.subjectIds,
          language: formData.language,
          videoFile: formData.videoFile || undefined,
        })
        toast.success('Chapter uploaded successfully')
      }
      onSuccess()
      handleClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save chapter'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{isEditMode ? 'Map Chapter' : 'Add Chapter'}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Video Upload */}
          {!isEditMode && (
            <div
              onClick={handleDropzoneClick}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 transition-colors hover:border-muted-foreground/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="mb-3 size-10 text-muted-foreground/50" />
              <p className="font-medium">Upload Video</p>
              <p className="text-sm text-muted-foreground">
                Accepted formats: mov, ; size less than 15mb (each)
              </p>
              {formData.videoFile && (
                <p className="mt-2 text-sm text-primary">
                  Selected: {formData.videoFile.name}
                </p>
              )}
            </div>
          )}

          {/* Chapter Name */}
          <div className="space-y-2">
            <Label htmlFor="chapterName">
              Chapter name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="chapterName"
              value={formData.chapterName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, chapterName: e.target.value }))
              }
              placeholder="Enter chapter name"
              disabled={isEditMode}
            />
          </div>

          {/* Map This Chapter Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Map this chapter</h3>

            <div className="grid grid-cols-4 gap-x-6 gap-y-3">
              {/* Exam Selection */}
              <div className="space-y-3">
                <Label className="text-muted-foreground">Exam</Label>
                {exams.map((exam) => (
                  <div key={exam.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`exam-${exam.id}`}
                      checked={formData.examIds.includes(exam.id)}
                      onCheckedChange={() => toggleArrayValue('examIds', exam.id)}
                    />
                    <Label
                      htmlFor={`exam-${exam.id}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {exam.name}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Course Selection */}
              <div className="space-y-3">
                <Label className="text-muted-foreground">Course</Label>
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`course-${course.id}`}
                      checked={formData.courseIds.includes(course.id)}
                      onCheckedChange={() =>
                        toggleArrayValue('courseIds', course.id)
                      }
                    />
                    <Label
                      htmlFor={`course-${course.id}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {course.name}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Subject Selection */}
              <div className="space-y-3">
                <Label className="text-muted-foreground">Subject</Label>
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={formData.subjectIds.includes(subject.id)}
                      onCheckedChange={() =>
                        toggleArrayValue('subjectIds', subject.id)
                      }
                    />
                    <Label
                      htmlFor={`subject-${subject.id}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {subject.name}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <Label className="text-muted-foreground">Language</Label>
                <RadioGroup
                  value={formData.language}
                  onValueChange={(value: 'Hindi' | 'English') =>
                    setFormData((prev) => ({ ...prev, language: value }))
                  }
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="Hindi" id="lang-hindi" />
                    <Label
                      htmlFor="lang-hindi"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Hindi
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="English" id="lang-english" />
                    <Label
                      htmlFor="lang-english"
                      className="cursor-pointer text-sm font-normal"
                    >
                      English
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditMode ? 'Save' : 'Upload'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
