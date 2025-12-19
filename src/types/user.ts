// User list item from /secure/dashboard/master-search
export interface UserListItem {
  userId: string
  username: string
  phoneNumber: number
  registrationDate: string // ISO datetime
  subscribed: boolean
  language: 'ENGLISH' | 'HINDI'
  selectedCourse: string
  schoolName: string | null
  schoolType: string | null
  schoolTiming: string | null
  gender: 'MALE' | 'FEMALE'
  microLecturesCompleted: number | null
  doubtsAsked: number | null
}

// User detail from /secure/app/users/{userId}
export interface UserDetail {
  userId: string
  username: string
  phoneNumber: number
  courseName: string
  className: string
  classId: string
  courseId: string
  boardId: string
  address: string
  myReferCode: string
  subscriptionType: string
  points: number
  freeDoubt: number
  registrationDate: string // "DD-MM-YYYY" format
  registeredDate: string // ISO datetime
  fcmToken: boolean
  subjects: UserSubject[]
  actions: UserAction[]
}

export interface UserSubject {
  id: string
  subjectName: string
}

export interface UserAction {
  actionType: string
  permission: string
}

// User test activity from /secure/user/activity/mocktest/tests
export interface UserTestActivity {
  title: string
  column: TestColumn[]
  data: TestData[]
}

export interface TestColumn {
  header: string
  accessor: string
}

export interface TestData {
  testId: string
  testName: string
  testType: string
  testCategory: string
  scoreCompare: string
  startTime: string
  timeTaken: string
  attemptedOn: string
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    offset: number
    paged: boolean
    unpaged: boolean
    sort: {
      sorted: boolean
      unsorted: boolean
      empty: boolean
    }
  }
  totalPages: number
  totalElements: number
  first: boolean
  last: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

// Dropdown types
export interface ClassOption {
  id: string
  className: string
  active: boolean
  pos: number
}

export interface CourseOption {
  id: string
  courseName: string
  active: boolean
  pos: number
  subjects: CourseSubject[]
  testSeriesSet: TestSeriesItem[]
}

export interface CourseSubject {
  id: string
  name: string
  displayName: string
  pos: number
  color: string
  iconUrl: string
  mainSubject: boolean
  boardsSubject: boolean
  progressEligible: boolean
}

export interface TestSeriesItem {
  id: string
  testSeriesId: string
  testSeriesName: string
  count: number
  iconUrl: string
  color: string
  active: boolean
  board: boolean
  accessType: string
  language: string
  testSeriesDisplayKey: string
  pos: number
  subscriptionType: string
}

export interface BoardOption {
  id: string
  name: string
  code: string
  imageUrl: string
  position: number
}

export interface SubjectOption {
  id: string
  key: string
  value: string
}

// User comments from /secure/user/comment/list/{userId}
export interface UserComment {
  id: string
  comment: string
  createdAt: string
  createdBy: string
}
