import { apiClient, analyticsClient } from './apiClient'
import type {
  UserListItem,
  UserDetail,
  UserTestActivity,
  UserComment,
  PaginatedResponse,
  ClassOption,
  CourseOption,
  BoardOption,
  SubjectOption,
  SubjectPaginatedResponse,
  PlanDuration,
  SubscriptionPlan,
  SubscriptionHistoryResponse,
  ApiResponse,
  MicrolectureEvent,
  MicrolectureDoubtEvent,
  InteractivityEvent,
} from '@/types/user'

export interface UserFilters {
  page?: number
  size?: number
  gender?: string
  subscriptionStatus?: string
  searchBy?: string
  searchText?: string
  fromDate?: string
  toDate?: string
}

/**
 * Fetch paginated list of users
 */
export const fetchUsers = async (
  filters: UserFilters = {}
): Promise<PaginatedResponse<UserListItem>> => {
  const params: Record<string, string> = {
    page: (filters.page ?? 0).toString(),
    pageSize: (filters.size ?? 10).toString(),
    searchBy: filters.searchBy ?? '',
    searchText: filters.searchText ?? '',
    fromDate: filters.fromDate ?? '',
    toDate: filters.toDate ?? '',
    gender: filters.gender?.toLowerCase() ?? '',
    subscriptionStatus: filters.subscriptionStatus ?? '',
  }

  return apiClient<PaginatedResponse<UserListItem>>(
    '/secure/dashboard/master-search',
    { params }
  )
}

/**
 * Fetch single user details by ID
 */
export const fetchUserById = async (userId: string): Promise<UserDetail> => {
  return apiClient<UserDetail>(`/secure/app/users/${userId}`)
}

/**
 * Fetch user's test activity
 */
export const fetchUserTests = async (userId: string): Promise<UserTestActivity> => {
  return apiClient<UserTestActivity>('/secure/user/activity/mocktest/tests', {
    params: {
      platformUserId: userId,
    },
  })
}

/**
 * Fetch available classes for dropdown
 */
export const fetchClasses = async (): Promise<ClassOption[]> => {
  return apiClient<ClassOption[]>('/secure/app/subscription-plan/classes')
}

/**
 * Fetch available courses for dropdown
 */
export const fetchCourses = async (): Promise<CourseOption[]> => {
  return apiClient<CourseOption[]>('/secure/app/subscription-plan/courses')
}

/**
 * Fetch available boards for dropdown
 */
export const fetchBoards = async (): Promise<BoardOption[]> => {
  return apiClient<BoardOption[]>('/secure/app/subscription-plan/boards')
}

export interface FetchSubjectsParams {
  pageNo?: number
  pageSize?: number
}

/**
 * Fetch available subjects for dropdown (paginated)
 */
export const fetchSubjects = async (
  params: FetchSubjectsParams = {}
): Promise<SubjectPaginatedResponse> => {
  const { pageNo = 0, pageSize = 10 } = params
  return apiClient<SubjectPaginatedResponse>(
    `/secure/api/v1/subject?pageNo=${pageNo}&pageSize=${pageSize}`
  )
}

/**
 * Fetch user comments
 */
export const fetchUserComments = async (userId: string): Promise<UserComment[]> => {
  return apiClient<UserComment[]>(`/secure/user/comment/list/${userId}`)
}

/**
 * Add a comment to a user
 */
export const addUserComment = async (payload: Partial<UserComment>): Promise<boolean> => {
  return apiClient<boolean>('/secure/user/comment/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Edit an existing user comment
 */
export const editUserComment = async (payload: Partial<UserComment>): Promise<boolean> => {
  return apiClient<boolean>('/secure/user/comment/edit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface UpdateUserPayload {
  userId: string
  username: string
  email: string 
  classId: string
  courseId: string
  boardId: string
  points: number
  freeDoubt: number
  address: string
  subjects: { id: string }[]
}

/**
 * Update user details
 */
export const updateUser = async (payload: UpdateUserPayload): Promise<{ msg: string }> => {
  return apiClient<{ msg: string }>('/secure/app/users/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ============= Subscription APIs =============

/**
 * Fetch plan durations for dropdown
 */
export const fetchPlanDurations = async (): Promise<PlanDuration[]> => {
  return apiClient<PlanDuration[]>('/secure/app/subscription-plan/plan-durations')
}

export interface SubscriptionHistoryFilters {
  userId: string
  date: string // Format: YYYY_MM_DD
  endDate: string // Format: YYYY_MM_DD
}

/**
 * Fetch user's subscription history
 */
export const fetchSubscriptionHistory = async (
  filters: SubscriptionHistoryFilters
): Promise<SubscriptionHistoryResponse> => {
  return apiClient<SubscriptionHistoryResponse>(
    '/secure/app/subscription-plan/user-subscription-history',
    {
      params: {
        userId: filters.userId,
        date: filters.date,
        endDate: filters.endDate,
      },
    }
  )
}

export interface SearchPlansFilters {
  isCombo: boolean
  courseId: string
  classId: string
  durationId: string
}

/**
 * Search subscription plans
 */
export const searchSubscriptionPlans = async (
  filters: SearchPlansFilters
): Promise<SubscriptionPlan[]> => {
  return apiClient<SubscriptionPlan[]>('/secure/app/subscription-plan/search', {
    params: {
      isCombo: filters.isCombo.toString(),
      courseId: filters.courseId,
      classId: filters.classId,
      durationId: filters.durationId,
    },
  })
}

export interface AddSubscriptionParams {
  userId: string
  planId: string
  amount: number
  receivedBy: string
  paymentMode: 'cash' | 'online' | 'upi' | 'card'
  paymentType: 'FULL_PAYMENT' | 'EMI'
}

/**
 * Add subscription to a user
 */
export const addSubscriptionToUser = async (
  params: AddSubscriptionParams
): Promise<ApiResponse<string>> => {
  return apiClient<ApiResponse<string>>(
    '/secure/app/subscription-plan/add-subscription-to-user',
    {
      params: {
        userId: params.userId,
        planId: params.planId,
        amount: params.amount.toString(),
        receivedBy: params.receivedBy,
        paymentMode: params.paymentMode,
        paymentType: params.paymentType,
      },
    }
  )
}

/**
 * Delete a subscription from a user
 */
export const deleteSubscriptionFromUser = async (
  userId: string,
  subscriptionId: string
): Promise<ApiResponse<unknown>> => {
  return apiClient<ApiResponse<unknown>>(
    '/secure/app/subscription-plan/delete-subscription-plan-of-user',
    {
      params: {
        userId,
        subscriptionId,
      },
    }
  )
}

export interface InitiatePaymentParams {
  userId: string
  planId: string
  amount: number
  couponCode?: string
}

/**
 * Initiate payment request for a user (sends notification to user)
 */
export const initiatePaymentForUser = async (
  params: InitiatePaymentParams
): Promise<ApiResponse<unknown>> => {
  const queryParams: Record<string, string> = {
    userId: params.userId,
    planId: params.planId,
    amount: params.amount.toString(),
  }
  if (params.couponCode) {
    queryParams.couponCode = params.couponCode
  }
  return apiClient<ApiResponse<unknown>>(
    '/secure/app/subscription-plan/raise-subscription-to-user',
    {
      params: queryParams,
    }
  )
}

// ============= App Events APIs (Analytics) =============

/**
 * Fetch user microlecture completion events
 */
export const fetchMicrolectureEvents = async (
  phoneNumber: string
): Promise<MicrolectureEvent[]> => {
  return analyticsClient<MicrolectureEvent[]>(
    '/user-detail/get-user-microlecture-completion',
    {
      params: { phone_number: phoneNumber },
    }
  )
}

/**
 * Fetch user microlecture doubt events
 */
export const fetchMicrolectureDoubtEvents = async (
  phoneNumber: string
): Promise<MicrolectureDoubtEvent[]> => {
  return analyticsClient<MicrolectureDoubtEvent[]>(
    '/user-detail/get-user-asked-doubt-in-microlecture',
    {
      params: { phone_number: phoneNumber },
    }
  )
}

/**
 * Fetch user interactivity attempt events
 */
export const fetchInteractivityEvents = async (
  phoneNumber: string
): Promise<InteractivityEvent[]> => {
  return analyticsClient<InteractivityEvent[]>(
    '/user-detail/get-user-inteactivity-attempts',
    {
      params: { phone_number: phoneNumber },
    }
  )
}
