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

// Subscription types

// Plan duration from /secure/app/subscription-plan/plan-durations
export interface PlanDuration {
  id: string
  value?: number
  durationUnit?: 'DAY' | 'MONTH' | 'YEAR'
  durationApplicable: boolean
  createdAt: number
  modifiedAt: number
}

// Subscription plan (used in history and search)
export interface SubscriptionPlan {
  id: string
  planName: string
  description: string | null
  planDescription: {
    id: string
    features: string
    description: string | null
  } | null
  courseId: string | null
  classId: string | null
  subjectId: string | null
  chapterId: string | null
  testSeriesId: string | null
  duration: PlanDuration | null
  coupon: SubscriptionCoupon | null
  subscriptionPlanLevel: string | null
  price: number | null
  perMonthPrice: number | null
  language: string
  newPlan: boolean
  combo: boolean
  createdAt: number | null
  modifiedAt: number | null
}

// Coupon attached to subscription plan
export interface SubscriptionCoupon {
  id: string
  code: string
  description: string | null
  discountAmount: number | null
  maxDiscountAmount: number | null
  discountPercentage: number | null
  validFrom: number
  validTo: number
  active: boolean
  couponLevel: string
  couponDiscountType: string
  validFromInString: string
  validToInString: string
}

// Invoice for a subscription
export interface SubscriptionInvoice {
  id: string
  amountPaid: number
  totalAmount: number
  discountApplied: number
  internalDiscount: number
  pdfUrl: string
  paymentStatus: string
  orderId: string
  subscriptionId: string
  createdAt: number
  modifiedAt: number
}

// Subscription history item
export interface SubscriptionHistoryItem {
  id: string
  user: unknown | null
  subscriptionPlan: SubscriptionPlan
  invoices: SubscriptionInvoice[]
  validFrom: number
  validTo: number
  currentValidFrom: number | null
  currentValidTo: number | null
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  paymentStatus: string
  purchasedOn: number
  totalAmount: number
  emiAmount: number | null
  numberOfEmis: number | null
  totalEmisPaid: number | null
  paymentMode: string
  paymentAmount: number
  paymentReceivedBy: string
  paymentReceivedByMetricsUserId: string
  createdAt: number
  modifiedAt: number
}

// Payment transaction from history
export interface PaymentTransaction {
  id: string
  amount: number
  status: string
  orderId: string
  createdAt: number
}

// Callback from history
export interface CallbackItem {
  id: string
  status: string
  createdAt: number
}

// User subscription history response
export interface SubscriptionHistoryResponse {
  code: string | null
  message: string | null
  success: boolean
  data: {
    callback_list: CallbackItem[]
    payment_transactions: PaymentTransaction[]
    subscription_history: SubscriptionHistoryItem[]
  }
}

// Generic API response wrapper
export interface ApiResponse<T> {
  code: string | null
  message: string | null
  success: boolean
  data: T
}
