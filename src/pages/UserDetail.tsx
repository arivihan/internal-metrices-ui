import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, User, MessageSquare, Bell, Pencil, Loader2, Plus, FileText, ExternalLink, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
  fetchPlanDurations,
  fetchSubscriptionHistory,
  searchSubscriptionPlans,
  addSubscriptionToUser,
  deleteSubscriptionFromUser,
  initiatePaymentForUser,
  type UpdateUserPayload,
} from '@/services/users'
import type {
  UserDetail as UserDetailType,
  UserTestActivity,
  ClassOption,
  CourseOption,
  BoardOption,
  SubjectOption,
  PlanDuration,
  SubscriptionPlan,
  SubscriptionHistoryItem,
} from '@/types/user'

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

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

  // Subscription tab state
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistoryItem[]>([])
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  })

  // Add Subscription dialog state
  const [addSubOpen, setAddSubOpen] = useState(false)
  const [addSubLoading, setAddSubLoading] = useState(false)
  const [addSubSubmitting, setAddSubSubmitting] = useState(false)
  const [durations, setDurations] = useState<PlanDuration[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [addSubForm, setAddSubForm] = useState({
    classId: '',
    courseId: '',
    durationId: '',
    isCombo: false,
    planId: '',
    amount: '',
    paymentType: 'FULL_PAYMENT' as 'FULL_PAYMENT' | 'EMI',
    receivedBy: '',
    paymentMode: 'cash' as 'cash' | 'online' | 'upi' | 'card',
  })

  // Show Logs dialog state (for individual subscription details)
  const [logsOpen, setLogsOpen] = useState(false)
  const [logsSubscription, setLogsSubscription] = useState<SubscriptionHistoryItem | null>(null)

  // Search Logs dialog state (date range search)
  const [searchLogsOpen, setSearchLogsOpen] = useState(false)
  const [searchLogsLoading, setSearchLogsLoading] = useState(false)
  const [searchLogsForm, setSearchLogsForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [searchLogsResults, setSearchLogsResults] = useState<{
    subscriptions: SubscriptionHistoryItem[]
    transactions: { id: string; amount: number; status: string; orderId: string; createdAt: number }[]
    callbacks: { id: string; status: string; createdAt: number }[]
  } | null>(null)

  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<SubscriptionHistoryItem | null>(null)

  // Initiate Payment dialog state
  const [initiatePayOpen, setInitiatePayOpen] = useState(false)
  const [initiatePayLoading, setInitiatePayLoading] = useState(false)
  const [initiatePaySubmitting, setInitiatePaySubmitting] = useState(false)
  const [initiatePayPlans, setInitiatePayPlans] = useState<SubscriptionPlan[]>([])
  const [initiatePayForm, setInitiatePayForm] = useState({
    classId: '',
    courseId: '',
    durationId: '',
    isCombo: false,
    planId: '',
    amount: '',
    couponCode: '',
  })

  // Track if subscription data has been loaded
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false)

  // Get active tab from URL or default to 'details'
  const validTabs = ['details', 'subscription', 'events']
  const tabFromUrl = searchParams.get('tab')
  const activeTab = validTabs.includes(tabFromUrl || '') ? tabFromUrl! : 'details'

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) return

      try {
        setLoading(true)
        setError(null)

        // First load user details and populate immediately
        const userResponse = await fetchUserById(userId)
        setUser(userResponse)
        setLoading(false)

        // Then load test activity separately
        setTestLoading(true)
        const testResponse = await fetchUserTests(userId)
        setTestActivity(testResponse)
        setTestLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user details')
        setLoading(false)
        setTestLoading(false)
      }
    }

    loadUserData()
  }, [userId])

  // Load subscription data only when tab is selected
  useEffect(() => {
    if (activeTab === 'subscription' && !subscriptionLoaded && userId) {
      const loadSubscriptionData = async () => {
        try {
          setSubscriptionLoading(true)
          const subResponse = await fetchSubscriptionHistory({
            userId,
            date: dateRange.fromDate.replace(/-/g, '_'),
            endDate: dateRange.toDate.replace(/-/g, '_'),
          })
          setSubscriptionHistory(subResponse.data?.subscription_history || [])
          setSubscriptionLoaded(true)
        } catch (err) {
          console.error('Failed to load subscription history:', err)
        } finally {
          setSubscriptionLoading(false)
        }
      }

      loadSubscriptionData()
    }
  }, [activeTab, subscriptionLoaded, userId, dateRange])

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

  // Subscription handlers
  const loadSubscriptionHistory = async () => {
    if (!userId) return

    try {
      setSubscriptionLoading(true)
      const response = await fetchSubscriptionHistory({
        userId,
        date: dateRange.fromDate.replace(/-/g, '_'),
        endDate: dateRange.toDate.replace(/-/g, '_'),
      })
      setSubscriptionHistory(response.data?.subscription_history || [])
    } catch (err) {
      console.error('Failed to load subscription history:', err)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleOpenAddSubscription = async () => {
    if (!user) return

    setAddSubForm({
      classId: user.classId,
      courseId: user.courseId,
      durationId: '',
      isCombo: false,
      planId: '',
      amount: '',
      paymentType: 'FULL_PAYMENT',
      receivedBy: '',
      paymentMode: 'cash',
    })
    setPlans([])
    setAddSubOpen(true)

    try {
      setAddSubLoading(true)
      const [classesData, coursesData, durationsData] = await Promise.all([
        fetchClasses(),
        fetchCourses(),
        fetchPlanDurations(),
      ])
      setClasses(classesData)
      setCourses(coursesData)
      setDurations(durationsData.filter((d) => d.durationApplicable))
    } catch (err) {
      console.error('Failed to load dropdown options:', err)
    } finally {
      setAddSubLoading(false)
    }
  }

  // Auto-search plans when class, course, duration change
  const handleSearchPlans = async (classId: string, courseId: string, durationId: string, isCombo: boolean) => {
    if (!classId || !courseId || !durationId) {
      setPlans([])
      return
    }

    try {
      const plansData = await searchSubscriptionPlans({
        classId,
        courseId,
        durationId,
        isCombo,
      })
      setPlans(plansData)
      setAddSubForm((prev) => ({ ...prev, planId: '' }))
    } catch (err) {
      console.error('Failed to search plans:', err)
      setPlans([])
    }
  }

  const handleAddSubFormChange = (field: string, value: string | boolean) => {
    const newForm = { ...addSubForm, [field]: value }
    setAddSubForm(newForm)

    // Auto-search plans when filters change
    if (['classId', 'courseId', 'durationId', 'isCombo'].includes(field)) {
      handleSearchPlans(
        field === 'classId' ? (value as string) : newForm.classId,
        field === 'courseId' ? (value as string) : newForm.courseId,
        field === 'durationId' ? (value as string) : newForm.durationId,
        field === 'isCombo' ? (value as boolean) : newForm.isCombo
      )
    }

    // Auto-fill amount when plan is selected
    if (field === 'planId') {
      const selectedPlan = plans.find((p) => p.id === value)
      if (selectedPlan) {
        setAddSubForm((prev) => ({
          ...prev,
          planId: value as string,
          amount: selectedPlan.price?.toString() || '',
        }))
      }
    }
  }

  const handleSubmitSubscription = async () => {
    if (!userId || !addSubForm.planId || !addSubForm.amount || !addSubForm.receivedBy) return

    try {
      setAddSubSubmitting(true)
      await addSubscriptionToUser({
        userId,
        planId: addSubForm.planId,
        amount: parseFloat(addSubForm.amount) || 0,
        receivedBy: addSubForm.receivedBy,
        paymentMode: addSubForm.paymentMode,
        paymentType: addSubForm.paymentType,
      })
      setAddSubOpen(false)
      // Reload subscription history
      const subResponse = await fetchSubscriptionHistory({
        userId,
        date: dateRange.fromDate.replace(/-/g, '_'),
        endDate: dateRange.toDate.replace(/-/g, '_'),
      })
      setSubscriptionHistory(subResponse.data?.subscription_history || [])
    } catch (err) {
      console.error('Failed to add subscription:', err)
    } finally {
      setAddSubSubmitting(false)
    }
  }

  const handleShowLogs = (subscription: SubscriptionHistoryItem) => {
    setLogsSubscription(subscription)
    setLogsOpen(true)
  }

  const handleOpenSearchLogs = () => {
    setSearchLogsForm({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    })
    setSearchLogsResults(null)
    setSearchLogsOpen(true)
  }

  const handleSearchLogs = async () => {
    if (!userId) return

    try {
      setSearchLogsLoading(true)
      const response = await fetchSubscriptionHistory({
        userId,
        date: searchLogsForm.startDate.replace(/-/g, '_'),
        endDate: searchLogsForm.endDate.replace(/-/g, '_'),
      })
      setSearchLogsResults({
        subscriptions: response.data?.subscription_history || [],
        transactions: response.data?.payment_transactions || [],
        callbacks: response.data?.callback_list || [],
      })
    } catch (err) {
      console.error('Failed to search logs:', err)
      toast.error('Failed to search logs')
    } finally {
      setSearchLogsLoading(false)
    }
  }

  const handleDeleteClick = (subscription: SubscriptionHistoryItem) => {
    setSubscriptionToDelete(subscription)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!userId || !subscriptionToDelete) return

    try {
      setDeleteLoading(true)
      await deleteSubscriptionFromUser(userId, subscriptionToDelete.id)
      setDeleteOpen(false)
      setSubscriptionToDelete(null)
      // Reload subscription history
      const subResponse = await fetchSubscriptionHistory({
        userId,
        date: dateRange.fromDate.replace(/-/g, '_'),
        endDate: dateRange.toDate.replace(/-/g, '_'),
      })
      setSubscriptionHistory(subResponse.data?.subscription_history || [])
    } catch (err) {
      console.error('Failed to delete subscription:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Initiate Payment handlers
  const handleOpenInitiatePayment = async () => {
    if (!user) return

    setInitiatePayForm({
      classId: user.classId,
      courseId: user.courseId,
      durationId: '',
      isCombo: false,
      planId: '',
      amount: '',
      couponCode: '',
    })
    setInitiatePayPlans([])
    setInitiatePayOpen(true)

    try {
      setInitiatePayLoading(true)
      const [classesData, coursesData, durationsData] = await Promise.all([
        fetchClasses(),
        fetchCourses(),
        fetchPlanDurations(),
      ])
      setClasses(classesData)
      setCourses(coursesData)
      setDurations(durationsData.filter((d) => d.durationApplicable))
    } catch (err) {
      console.error('Failed to load dropdown options:', err)
    } finally {
      setInitiatePayLoading(false)
    }
  }

  const handleSearchInitiatePayPlans = async (classId: string, courseId: string, durationId: string, isCombo: boolean) => {
    if (!classId || !courseId || !durationId) {
      setInitiatePayPlans([])
      return
    }

    try {
      const plansData = await searchSubscriptionPlans({
        classId,
        courseId,
        durationId,
        isCombo,
      })
      setInitiatePayPlans(plansData)
      setInitiatePayForm((prev) => ({ ...prev, planId: '' }))
    } catch (err) {
      console.error('Failed to search plans:', err)
      setInitiatePayPlans([])
    }
  }

  const handleInitiatePayFormChange = (field: string, value: string | boolean) => {
    const newForm = { ...initiatePayForm, [field]: value }
    setInitiatePayForm(newForm)

    // Auto-search plans when filters change
    if (['classId', 'courseId', 'durationId', 'isCombo'].includes(field)) {
      handleSearchInitiatePayPlans(
        field === 'classId' ? (value as string) : newForm.classId,
        field === 'courseId' ? (value as string) : newForm.courseId,
        field === 'durationId' ? (value as string) : newForm.durationId,
        field === 'isCombo' ? (value as boolean) : newForm.isCombo
      )
    }

    // Auto-fill amount when plan is selected
    if (field === 'planId') {
      const selectedPlan = initiatePayPlans.find((p) => p.id === value)
      if (selectedPlan) {
        setInitiatePayForm((prev) => ({
          ...prev,
          planId: value as string,
          amount: selectedPlan.price?.toString() || '',
        }))
      }
    }
  }

  const handleSubmitInitiatePayment = async () => {
    if (!userId || !initiatePayForm.planId || !initiatePayForm.amount) return

    try {
      setInitiatePaySubmitting(true)
      await initiatePaymentForUser({
        userId,
        planId: initiatePayForm.planId,
        amount: parseFloat(initiatePayForm.amount) || 0,
        couponCode: initiatePayForm.couponCode || undefined,
      })
      setInitiatePayOpen(false)
      toast.success('Payment initiation request submitted successfully. Please check back after some time for the subscription status.')
    } catch (err) {
      console.error('Failed to initiate payment:', err)
      toast.error('Failed to initiate payment. Please try again.')
    } finally {
      setInitiatePaySubmitting(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDuration = (duration: PlanDuration | null) => {
    if (!duration || !duration.durationApplicable) return 'N/A'
    return `${duration.value} ${duration.durationUnit}`
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
    <div className="min-w-0 space-y-6">
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0 w-full">
        <TabsList className="w-full">
          <TabsTrigger value="details" className="flex-1">User Details</TabsTrigger>
          <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
          <TabsTrigger value="events" className="flex-1">App Events</TabsTrigger>
        </TabsList>

        {/* User Details Tab */}
        <TabsContent value="details" className="mt-6 min-w-0 space-y-6">
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
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">
                {testActivity?.title || 'Test Series Activity'}
                {!testLoading && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({testActivity?.data.length ?? 0} tests)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {testLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : testActivity?.data.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No test activity found
                </p>
              ) : (
                <div className="max-w-full overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {testActivity?.column
                          .filter((col) => col.accessor !== 'startTime')
                          .map((col) => {
                            // Shorten long header names
                            let headerText = col.header
                            if (col.header.toLowerCase().includes('score obtained')) {
                              headerText = 'Obtained / Total'
                            }
                            return (
                              <TableHead key={col.accessor} className="whitespace-nowrap">
                                {headerText}
                              </TableHead>
                            )
                          })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testActivity?.data.map((test, index) => (
                        <TableRow key={test.testId || index}>
                          {testActivity.column
                            .filter((col) => col.accessor !== 'startTime')
                            .map((col) => {
                              const value = test[col.accessor as keyof typeof test]
                              // Format attemptedOn to show date and time on separate lines
                              if (col.accessor === 'attemptedOn' && typeof value === 'string') {
                                // Format: "Thu Dec 19, 2024 10:30 AM" -> split at comma or parse
                                const parts = value.match(/^(.+?\d{1,2},?\s*\d{4})\s*(.*)$/)
                                if (parts) {
                                  return (
                                    <TableCell key={col.accessor}>
                                      <div className="text-sm">
                                        <p>{parts[1]}</p>
                                        <p className="text-muted-foreground">{parts[2]}</p>
                                      </div>
                                    </TableCell>
                                  )
                                }
                              }
                              return (
                                <TableCell key={col.accessor} className="whitespace-nowrap">
                                  {value}
                                </TableCell>
                              )
                            })}
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
        <TabsContent value="subscription" className="mt-6 space-y-4">
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Active Subscriptions
              {subscriptionHistory.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({subscriptionHistory.length})
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenSearchLogs}>
                Show Logs
              </Button>
              <Button variant="outline" onClick={handleOpenInitiatePayment}>
                Initiate Payment
              </Button>
              <Button onClick={handleOpenAddSubscription}>
                <Plus className="mr-1.5 size-4" />
                Add New Subscription
              </Button>
            </div>
          </div>

          {/* Active Subscriptions Table */}
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptionHistory.length === 0 ? (
            <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
              No active subscriptions found
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Plan</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionHistory.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium leading-tight">
                            {sub.subscriptionPlan?.planName || 'Unknown Plan'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            via {sub.paymentMode === 'online' ? 'INTERNAL_METRICS' : sub.paymentMode?.toUpperCase()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {sub.subscriptionPlan?.subscriptionPlanLevel || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(sub.validFrom)}</p>
                          <p className="text-muted-foreground">to {formatDate(sub.validTo)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">₹{sub.invoices?.[0]?.amountPaid || 0}</p>
                          <p className="text-xs text-muted-foreground">of ₹{sub.totalAmount}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{sub.paymentReceivedBy || '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {sub.invoices?.[0]?.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => window.open(sub.invoices[0].pdfUrl, '_blank')}
                              title="View Invoice"
                            >
                              <FileText className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleDeleteClick(sub)}
                            title="Delete Subscription"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleShowLogs(sub)}
                            title="View Details"
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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

      {/* Add Subscription Dialog */}
      <Dialog open={addSubOpen} onOpenChange={setAddSubOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
          </DialogHeader>

          {addSubLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3 py-2">
              {/* User Info (read-only) */}
              <div className="grid grid-cols-2 gap-3">
                <Input value={user?.username || ''} disabled className="bg-muted" />
                <Input value={user?.phoneNumber?.toString() || ''} disabled className="bg-muted" />
              </div>

              {/* Class & Course */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={addSubForm.classId}
                  onValueChange={(value) => handleAddSubFormChange('classId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={addSubForm.courseId}
                  onValueChange={(value) => handleAddSubFormChange('courseId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Course" />
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

              {/* Duration & Combo */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={addSubForm.durationId}
                  onValueChange={(value) => handleAddSubFormChange('durationId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.value} {d.durationUnit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex h-9 items-center rounded-md border px-3">
                  <Checkbox
                    id="isCombo"
                    checked={addSubForm.isCombo}
                    onCheckedChange={(checked) => handleAddSubFormChange('isCombo', checked === true)}
                  />
                  <label htmlFor="isCombo" className="ml-2 text-sm">
                    Combo
                  </label>
                </div>
              </div>

              <Separator className="my-1" />

              {/* Subscription Plan */}
              <Select
                value={addSubForm.planId}
                onValueChange={(value) => handleAddSubFormChange('planId', value)}
                disabled={plans.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Subscription Plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.planName} - ₹{plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Amount Paid */}
              <Input
                type="number"
                placeholder="Amount Paid"
                value={addSubForm.amount}
                onChange={(e) => handleAddSubFormChange('amount', e.target.value)}
              />

              {/* Payment Type */}
              <Select
                value={addSubForm.paymentType}
                onValueChange={(value) => handleAddSubFormChange('paymentType', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_PAYMENT">Full Payment</SelectItem>
                  <SelectItem value="EMI">EMI</SelectItem>
                </SelectContent>
              </Select>

              {/* Received By & Payment Mode */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Received By"
                  value={addSubForm.receivedBy}
                  onChange={(e) => handleAddSubFormChange('receivedBy', e.target.value)}
                />
                <Select
                  value={addSubForm.paymentMode}
                  onValueChange={(value) => handleAddSubFormChange('paymentMode', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Payment Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSubOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleSubmitSubscription}
              disabled={addSubSubmitting || !addSubForm.planId || !addSubForm.amount || !addSubForm.receivedBy}
            >
              {addSubSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Logs Dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Logs</DialogTitle>
            <DialogDescription>
              {logsSubscription?.subscriptionPlan?.planName}
            </DialogDescription>
          </DialogHeader>

          {logsSubscription && (
            <div className="space-y-4 py-4">
              {/* Subscription Details */}
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-medium">Subscription Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <Badge variant={logsSubscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {logsSubscription.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Status:</span>{' '}
                    <span className="font-medium">{logsSubscription.paymentStatus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid From:</span>{' '}
                    <span className="font-medium">{formatDate(logsSubscription.validFrom)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valid To:</span>{' '}
                    <span className="font-medium">{formatDate(logsSubscription.validTo)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Mode:</span>{' '}
                    <span className="font-medium capitalize">{logsSubscription.paymentMode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Amount Paid:</span>{' '}
                    <span className="font-medium">₹{logsSubscription.paymentAmount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>{' '}
                    <span className="font-medium">₹{logsSubscription.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Received By:</span>{' '}
                    <span className="font-medium">{logsSubscription.paymentReceivedBy}</span>
                  </div>
                </div>
              </div>

              {/* Invoices */}
              {logsSubscription.invoices && logsSubscription.invoices.length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="font-medium">Invoices ({logsSubscription.invoices.length})</h4>
                  <div className="space-y-2">
                    {logsSubscription.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between rounded border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">Order: {invoice.orderId}</p>
                          <p className="text-muted-foreground">
                            Paid: ₹{invoice.amountPaid} | Total: ₹{invoice.totalAmount} | Discount: ₹{invoice.internalDiscount}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={invoice.paymentStatus === 'SUCCESS' ? 'default' : 'secondary'}>
                            {invoice.paymentStatus}
                          </Badge>
                          {invoice.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => window.open(invoice.pdfUrl, '_blank')}
                            >
                              <ExternalLink className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription?
            </DialogDescription>
          </DialogHeader>
          {subscriptionToDelete && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p className="font-medium">{subscriptionToDelete.subscriptionPlan?.planName}</p>
              <p className="text-muted-foreground">
                {formatDate(subscriptionToDelete.validFrom)} - {formatDate(subscriptionToDelete.validTo)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initiate Payment Dialog */}
      <Dialog open={initiatePayOpen} onOpenChange={setInitiatePayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Initiate Payment</DialogTitle>
            <DialogDescription>
              Send a payment request to the user
            </DialogDescription>
          </DialogHeader>

          {initiatePayLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3 py-2">
              {/* User Info (read-only) */}
              <div className="grid grid-cols-2 gap-3">
                <Input value={user?.username || ''} disabled className="bg-muted" />
                <Input value={user?.phoneNumber?.toString() || ''} disabled className="bg-muted" />
              </div>

              {/* Class & Course */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={initiatePayForm.classId}
                  onValueChange={(value) => handleInitiatePayFormChange('classId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={initiatePayForm.courseId}
                  onValueChange={(value) => handleInitiatePayFormChange('courseId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Course" />
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

              {/* Duration & Combo */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={initiatePayForm.durationId}
                  onValueChange={(value) => handleInitiatePayFormChange('durationId', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.value} {d.durationUnit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex h-9 items-center rounded-md border px-3">
                  <Checkbox
                    id="initiatePayCombo"
                    checked={initiatePayForm.isCombo}
                    onCheckedChange={(checked) => handleInitiatePayFormChange('isCombo', checked === true)}
                  />
                  <label htmlFor="initiatePayCombo" className="ml-2 text-sm">
                    Combo
                  </label>
                </div>
              </div>

              <Separator className="my-1" />

              {/* Subscription Plan */}
              <Select
                value={initiatePayForm.planId}
                onValueChange={(value) => handleInitiatePayFormChange('planId', value)}
                disabled={initiatePayPlans.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Subscription Plan" />
                </SelectTrigger>
                <SelectContent>
                  {initiatePayPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.planName} - ₹{plan.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Amount */}
              <Input
                type="number"
                placeholder="Amount"
                value={initiatePayForm.amount}
                onChange={(e) => handleInitiatePayFormChange('amount', e.target.value)}
              />

              {/* Coupon Code */}
              <Input
                placeholder="Coupon Code (optional)"
                value={initiatePayForm.couponCode}
                onChange={(e) => handleInitiatePayFormChange('couponCode', e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInitiatePayOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInitiatePayment}
              disabled={initiatePaySubmitting || !initiatePayForm.planId || !initiatePayForm.amount}
            >
              {initiatePaySubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Logs Dialog */}
      <Dialog open={searchLogsOpen} onOpenChange={setSearchLogsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Subscription Logs</DialogTitle>
            <DialogDescription>
              Search subscription history by date range
            </DialogDescription>
          </DialogHeader>

          {/* Search Form */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={searchLogsForm.startDate}
                onChange={(e) => setSearchLogsForm({ ...searchLogsForm, startDate: e.target.value })}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={searchLogsForm.endDate}
                onChange={(e) => setSearchLogsForm({ ...searchLogsForm, endDate: e.target.value })}
              />
            </div>
            <Button onClick={handleSearchLogs} disabled={searchLogsLoading}>
              {searchLogsLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Search
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto space-y-4 mt-4">
            {searchLogsResults === null ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Select a date range and click Search
              </p>
            ) : (
              <>
                {/* Subscriptions */}
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Subscriptions ({searchLogsResults.subscriptions.length})
                  </h4>
                  {searchLogsResults.subscriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subscriptions found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchLogsResults.subscriptions.map((sub) => (
                        <div key={sub.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{sub.subscriptionPlan?.planName}</span>
                            <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {sub.status}
                            </Badge>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {formatDate(sub.validFrom)} - {formatDate(sub.validTo)} | ₹{sub.paymentAmount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment Transactions */}
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Payment Transactions ({searchLogsResults.transactions.length})
                  </h4>
                  {searchLogsResults.transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchLogsResults.transactions.map((txn) => (
                        <div key={txn.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Order: {txn.orderId}</span>
                            <Badge variant={txn.status === 'SUCCESS' ? 'default' : 'secondary'}>
                              {txn.status}
                            </Badge>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            ₹{txn.amount} | {formatDate(txn.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Callbacks */}
                <div className="space-y-2">
                  <h4 className="font-medium">
                    Callbacks ({searchLogsResults.callbacks.length})
                  </h4>
                  {searchLogsResults.callbacks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No callbacks found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchLogsResults.callbacks.map((cb) => (
                        <div key={cb.id} className="rounded-lg border p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Callback</span>
                            <Badge variant="secondary">{cb.status}</Badge>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {formatDate(cb.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSearchLogsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
