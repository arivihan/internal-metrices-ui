import { apiClient } from './apiClient'
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

/**
 * Fetch available subjects for dropdown
 */
export const fetchSubjects = async (): Promise<SubjectOption[]> => {
  return apiClient<SubjectOption[]>('/secure/app/subject/get')
}

/**
 * Fetch user comments
 */
export const fetchUserComments = async (userId: string): Promise<UserComment[]> => {
  return apiClient<UserComment[]>(`/secure/user/comment/list/${userId}`)
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
