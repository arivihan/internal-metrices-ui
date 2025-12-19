import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, MessageSquare, Bell, Pencil, Loader2 } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

import {
  fetchUserById,
  fetchUserTests,
  fetchClasses,
  fetchCourses,
  fetchBoards,
  fetchSubjects,
  updateUser,
  type UpdateUserPayload,
} from '@/services/users'
import type {
  UserDetail as UserDetailType,
  UserTestActivity,
  ClassOption,
  CourseOption,
  BoardOption,
  SubjectOption,
} from '@/types/user'

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserDetailType | null>(null)
  const [testActivity, setTestActivity] = useState<UserTestActivity | null>(null)

  // Comments dialog state
  const [commentsOpen, setCommentsOpen] = useState(false)

  // Notify dialog state
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyForm, setNotifyForm] = useState({
    title: '',
    comment: '',
    imageUrl: '',
  })

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [boards, setBoards] = useState<BoardOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    classId: '',
    courseId: '',
    boardId: '',
    points: 0,
    freeDoubt: 0,
    address: '',
    subjectIds: [] as string[],
  })

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return

      try {
        setLoading(true)
        setError(null)

        const [userResponse, testResponse] = await Promise.all([
          fetchUserById(userId),
          fetchUserTests(userId),
        ])

        setUser(userResponse)
        setTestActivity(testResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user details')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [userId])

  const handleBack = () => {
    navigate('/dashboard/users')
  }

  const handleOpenComments = () => {
    setCommentsOpen(true)
  }

  const handleOpenEdit = async () => {
    if (!user) return

    // Set form values from current user
    setEditForm({
      username: user.username,
      email: '',
      classId: user.classId,
      courseId: user.courseId,
      boardId: user.boardId,
      points: user.points,
      freeDoubt: user.freeDoubt,
      address: user.address || '',
      subjectIds: user.subjects?.map((s) => s.id) || [],
    })

    setEditOpen(true)

    // Load dropdown options
    try {
      setEditLoading(true)
      const [classesData, coursesData, boardsData, subjectsData] = await Promise.all([
        fetchClasses(),
        fetchCourses(),
        fetchBoards(),
        fetchSubjects(),
      ])
      setClasses(classesData)
      setCourses(coursesData)
      setBoards(boardsData)
      setSubjects(subjectsData)
    } catch (err) {
      console.error('Failed to load dropdown options:', err)
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!userId) return

    try {
      setEditSaving(true)
      const payload: UpdateUserPayload = {
        userId,
        username: editForm.username,
        email: editForm.email,
        classId: editForm.classId,
        courseId: editForm.courseId,
        boardId: editForm.boardId,
        points: editForm.points,
        freeDoubt: editForm.freeDoubt,
        address: editForm.address,
        subjects: editForm.subjectIds.map((id) => ({ id })),
      }
      await updateUser(payload)
      setEditOpen(false)

      // Reload user data
      const updatedUser = await fetchUserById(userId)
      setUser(updatedUser)
    } catch (err) {
      console.error('Failed to update user:', err)
    } finally {
      setEditSaving(false)
    }
  }

  const toggleSubject = (subjectId: string) => {
    setEditForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10" />
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-1 h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" onClick={handleBack} className="w-fit">
          <ArrowLeft className="mr-2 size-4" />
          Back to Users
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error || 'User not found'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="mr-1 size-4" />
        Back to Users
      </Button>

      {/* User Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <User className="size-7 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{user.username}</h1>
              <Badge variant={user.subscriptionType === 'Premium' ? 'default' : 'secondary'}>
                {user.subscriptionType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenComments}>
            <MessageSquare className="mr-1.5 size-3.5" />
            View Comments
          </Button>
          <Button variant="outline" size="sm" onClick={() => setNotifyOpen(true)}>
            <Bell className="mr-1.5 size-3.5" />
            Notify User
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenEdit}>
            <Pencil className="mr-1.5 size-3.5" />
            Edit User
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="details" className="flex-1">User Details</TabsTrigger>
          <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
          <TabsTrigger value="events" className="flex-1">App Events</TabsTrigger>
        </TabsList>

        {/* User Details Tab */}
        <TabsContent value="details" className="mt-6 space-y-6">
          {/* Info Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Phone Number</span>
                  <span className="text-sm font-medium">{user.phoneNumber}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Course</span>
                  <span className="text-sm font-medium">{user.courseName}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Class</span>
                  <span className="text-sm font-medium">{user.className}</span>
                </div>
                <Separator />
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-sm text-muted-foreground">Address</span>
                  <span className="max-w-[50%] text-right text-sm font-medium">{user.address || '—'}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Registration Date</span>
                  <span className="text-sm font-medium">{user.registrationDate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Rewards & Referral</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points</span>
                  <span className="text-sm font-medium">{user.points}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Free Doubts</span>
                  <span className="text-sm font-medium">{user.freeDoubt}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Referral Code</span>
                  <span className="font-mono text-sm font-medium">{user.myReferCode}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subjects */}
          {user.subjects && user.subjects.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">
                  Enrolled Subjects
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({user.subjects.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {user.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-center rounded-lg border bg-muted/50 px-3 py-2.5 text-center text-sm font-medium"
                    >
                      {subject.subjectName}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Activity */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">
                {testActivity?.title || 'Test Series Activity'}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({testActivity?.data.length ?? 0} tests)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testActivity?.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No test activity found
                </p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {testActivity?.column.map((col) => (
                          <TableHead key={col.accessor}>{col.header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testActivity?.data.map((test, index) => (
                        <TableRow key={test.testId || index}>
                          {testActivity.column.map((col) => (
                            <TableCell key={col.accessor}>
                              {test[col.accessor as keyof typeof test]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">Subscription History</CardTitle>
              <CardDescription>View subscription details and history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-muted-foreground">
                Subscription information coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User App Events Tab */}
        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">App Events</CardTitle>
              <CardDescription>User activity and app events log</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-8 text-center text-sm text-muted-foreground">
                App events information coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comments Dialog */}
      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Comments</DialogTitle>
            <DialogDescription>
              View and manage comments for this user
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-sm text-muted-foreground">
            This feature is yet to be implemented
          </div>
        </DialogContent>
      </Dialog>

      {/* Notify User Dialog */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify User</DialogTitle>
            <DialogDescription>
              Send a notification to this user
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notify-title">Title</Label>
              <Input
                id="notify-title"
                placeholder="Notification title"
                value={notifyForm.title}
                onChange={(e) => setNotifyForm({ ...notifyForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify-comment">Comment</Label>
              <Textarea
                id="notify-comment"
                placeholder="Enter your message..."
                rows={4}
                value={notifyForm.comment}
                onChange={(e) => setNotifyForm({ ...notifyForm, comment: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify-image">Image URL</Label>
              <Input
                id="notify-image"
                placeholder="https://example.com/image.png"
                value={notifyForm.imageUrl}
                onChange={(e) => setNotifyForm({ ...notifyForm, imageUrl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyOpen(false)}>
              Cancel
            </Button>
            <Button disabled>
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and preferences
            </DialogDescription>
          </DialogHeader>

          {editLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 overflow-y-auto py-4 pr-2">
              {/* Row 1: Username & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={editForm.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Class & Course */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={editForm.classId}
                    onValueChange={(value) => setEditForm({ ...editForm, classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={editForm.courseId}
                    onValueChange={(value) => setEditForm({ ...editForm, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Board */}
              <div className="space-y-2">
                <Label>Board</Label>
                <Select
                  value={editForm.boardId}
                  onValueChange={(value) => setEditForm({ ...editForm, boardId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3: Points & Free Doubts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={editForm.points}
                    onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeDoubt">Free Doubts</Label>
                  <Input
                    id="freeDoubt"
                    type="number"
                    value={editForm.freeDoubt}
                    onChange={(e) => setEditForm({ ...editForm, freeDoubt: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Row 4: Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>

              {/* Row 5: Subjects */}
              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="grid grid-cols-3 gap-2 rounded-lg border p-3">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject.id}`}
                        checked={editForm.subjectIds.includes(subject.id)}
                        onCheckedChange={() => toggleSubject(subject.id)}
                      />
                      <label
                        htmlFor={`subject-${subject.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {subject.value}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={editSaving || editLoading}>
              {editSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
