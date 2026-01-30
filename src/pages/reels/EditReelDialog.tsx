import { useState, useEffect } from "react";
import { Loader2, Plus, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import {
  updateReel,
  fetchExamsPaginated,
  fetchGradesPaginated,
  fetchStreamsPaginated,
  fetchTags,
} from "@/services/reels";
import type {
  ReelResponseDto,
  ReelUpdateRequest,
  ExamOption,
  GradeOption,
  StreamOption,
  TagResponseDto,
} from "@/types/reels";

interface EditReelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: ReelResponseDto | null;
  onSuccess: () => void;
}

export function EditReelDialog({ open, onOpenChange, reel, onSuccess }: EditReelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [difficultyLevel, setDifficultyLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER");
  const [language, setLanguage] = useState<"ENGLISH" | "HINDI">("ENGLISH");
  const [isGlobal, setIsGlobal] = useState(false);

  // Targeting state
  const [targeting, setTargeting] = useState<{ examId: number; gradeId: number; streamId: number }[]>([]);
  const [currentExam, setCurrentExam] = useState<ExamOption | null>(null);
  const [currentGrade, setCurrentGrade] = useState<GradeOption | null>(null);
  const [currentStream, setCurrentStream] = useState<StreamOption | null>(null);

  // Tags state
  const [selectedTags, setSelectedTags] = useState<TagResponseDto[]>([]);

  // Dropdown data
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [grades, setGrades] = useState<GradeOption[]>([]);
  const [streams, setStreams] = useState<StreamOption[]>([]);
  const [tags, setTags] = useState<TagResponseDto[]>([]);

  // Loading states
  const [examsLoading, setExamsLoading] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Dropdown open states
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);

  useEffect(() => {
    if (open && reel) {
      loadInitialData();
      populateForm(reel);
    }
  }, [open, reel]);

  const loadInitialData = async () => {
    // Load exams
    setExamsLoading(true);
    try {
      const response = await fetchExamsPaginated({ pageNo: 0, pageSize: 50, active: true });
      setExams(response.content || []);
    } catch (error) {
      console.error("Failed to load exams:", error);
    } finally {
      setExamsLoading(false);
    }

    // Load grades
    setGradesLoading(true);
    try {
      const response = await fetchGradesPaginated({ pageNo: 0, pageSize: 50, active: true });
      setGrades(response.content || []);
    } catch (error) {
      console.error("Failed to load grades:", error);
    } finally {
      setGradesLoading(false);
    }

    // Load streams
    setStreamsLoading(true);
    try {
      const response = await fetchStreamsPaginated({ pageNo: 0, pageSize: 50, active: true });
      setStreams(response.content || []);
    } catch (error) {
      console.error("Failed to load streams:", error);
    } finally {
      setStreamsLoading(false);
    }

    // Load tags
    setTagsLoading(true);
    try {
      const response = await fetchTags({ pageNo: 0, pageSize: 100 });
      setTags(response.content || []);
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setTagsLoading(false);
    }
  };

  const populateForm = (reel: ReelResponseDto) => {
    setTitle(reel.title || "");
    setDescription(reel.description || "");
    setVideoUrl(reel.videoUrl || "");
    setThumbnailUrl(reel.thumbnailUrl || "");
    setDurationSeconds(reel.durationSeconds || 0);
    setDifficultyLevel(reel.difficultyLevel || "BEGINNER");
    setLanguage(reel.language || "ENGLISH");
    setIsGlobal(reel.isGlobal || false);
    setTargeting(
      reel.targeting?.map((t) => ({
        examId: t.examId,
        gradeId: t.gradeId,
        streamId: t.streamId,
      })) || []
    );
    setSelectedTags(
      reel.tags?.map((t) => ({
        id: t.tagId,
        name: t.tagName,
        slug: "",
        createdAt: "",
        reelCount: 0,
      })) || []
    );
  };

  const handleAddTargeting = () => {
    if (currentExam && currentGrade && currentStream) {
      const exists = targeting.some(
        (t) => t.examId === currentExam.id && t.gradeId === currentGrade.id && t.streamId === currentStream.id
      );
      if (!exists) {
        setTargeting([
          ...targeting,
          { examId: currentExam.id, gradeId: currentGrade.id, streamId: currentStream.id },
        ]);
      }
      setCurrentExam(null);
      setCurrentGrade(null);
      setCurrentStream(null);
    }
  };

  const handleRemoveTargeting = (index: number) => {
    setTargeting(targeting.filter((_, i) => i !== index));
  };

  const handleTagToggle = (tag: TagResponseDto) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.id === tag.id);
      if (exists) {
        return prev.filter((t) => t.id !== tag.id);
      }
      return [...prev, tag];
    });
  };

  const getExamName = (examId: number) => exams.find((e) => e.id === examId)?.name || `Exam ${examId}`;
  const getGradeName = (gradeId: number) => grades.find((g) => g.id === gradeId)?.name || `Grade ${gradeId}`;
  const getStreamName = (streamId: number) => streams.find((s) => s.id === streamId)?.name || `Stream ${streamId}`;

  const handleSubmit = async () => {
    if (!reel) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!videoUrl.trim()) {
      toast.error("Video URL is required");
      return;
    }
    if (!isGlobal && targeting.length === 0) {
      toast.error("Please add at least one targeting or mark as global");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ReelUpdateRequest = {
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        durationSeconds,
        difficultyLevel,
        language,
        isGlobal,
        targeting: isGlobal ? [] : targeting,
        tagIds: selectedTags.map((t) => t.id),
      };

      await updateReel(reel.id, payload);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Failed to update reel:", error);
      toast.error("Failed to update reel: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Reel</DialogTitle>
          <DialogDescription>Update reel information and targeting.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter reel title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter reel description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Video URL */}
          <div className="grid gap-2">
            <Label htmlFor="videoUrl">Video URL *</Label>
            <Input
              id="videoUrl"
              placeholder="https://cdn.example.com/videos/reel.mp4"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          {/* Thumbnail URL */}
          <div className="grid gap-2">
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              placeholder="https://cdn.example.com/thumbnails/reel.jpg"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </div>

          {/* Duration, Difficulty, Language */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                placeholder="45"
                value={durationSeconds || ""}
                onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={(v) => setDifficultyLevel(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENGLISH">English</SelectItem>
                  <SelectItem value="HINDI">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Is Global Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Global Reel</Label>
              <p className="text-sm text-muted-foreground">Make this reel available to all users</p>
            </div>
            <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
          </div>

          {/* Targeting Section */}
          {!isGlobal && (
            <div className="grid gap-3 p-3 bg-muted/30 rounded-lg border">
              <Label>Targeting *</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={currentExam?.id?.toString() || ""}
                  onValueChange={(v) => setCurrentExam(exams.find((e) => e.id === parseInt(v)) || null)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id.toString()}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={currentGrade?.id?.toString() || ""}
                  onValueChange={(v) => setCurrentGrade(grades.find((g) => g.id === parseInt(v)) || null)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={currentStream?.id?.toString() || ""}
                  onValueChange={(v) => setCurrentStream(streams.find((s) => s.id === parseInt(v)) || null)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {streams.map((stream) => (
                      <SelectItem key={stream.id} value={stream.id.toString()}>
                        {stream.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  size="icon"
                  onClick={handleAddTargeting}
                  disabled={!currentExam || !currentGrade || !currentStream}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Targeting List */}
              {targeting.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {targeting.map((t, index) => (
                    <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1">
                      {getExamName(t.examId)} / {getGradeName(t.gradeId)} / {getStreamName(t.streamId)}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => handleRemoveTargeting(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags Section */}
          <div className="grid gap-2">
            <Label>Tags</Label>
            <Popover open={tagsDropdownOpen} onOpenChange={setTagsDropdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between">
                  <span>
                    {selectedTags.length > 0 ? `${selectedTags.length} tag(s) selected` : "Select tags..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                {selectedTags.length > 0 && (
                  <div className="p-2 border-b flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagToggle(tag);
                          }}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="max-h-60 overflow-y-auto scrollbar-hide p-1">
                  {tagsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : tags.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">No tags found.</div>
                  ) : (
                    tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-accent rounded text-sm"
                        onClick={() => handleTagToggle(tag)}
                      >
                        <Checkbox checked={selectedTags.some((t) => t.id === tag.id)} className="mr-2" />
                        <span className="flex-1">{tag.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Reel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
