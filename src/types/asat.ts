// ASAT Scorecard status types
export type ASATStatus = 'PENDING' | 'VERIFIED' | 'REJECTED'

// Marksheet info nested object
export interface ASATMarksheetInfo {
  uploaded: boolean
  roll: string | null
  percent: number | null
  url: string | null
  timestamp: number
  date: string | null
}

// Test info nested object
export interface ASATTestInfo {
  attempted: boolean
  marks: number
  totalMarks: number
  percentage: number
  timestamp: number
  testId: string
  testGroupId: string
  testName: string
  date: string // ISO datetime
}

// Result info nested object
export interface ASATResultInfo {
  approved: boolean
  approvedBy: string | null
  rejectionRemarks: string | null
  infoStatus: ASATStatus
  rejectMessage: string | null
  verifiedBy: string | null
  verifiedOn: string | null
  percentDiscount: number
  couponName: string | null
  couponText: string | null
  subscriptionId: string | null
  principalAmount: string | null
  finalAmount: string | null
  subscriptionName: string | null
  imageUrl: string | null
  expiryTime: number
  createdOn: number
  expiredCouponText: string | null
  offerAmount: number | null
  checked: boolean
}

// ASAT Scorecard item from /secure/asat endpoint
export interface ASATScorecard {
  id: string
  scholarshipInfoId: string
  userId: string
  userName: string
  userPhone: string | null
  classId: string
  courseId: string
  language: string | null
  description: string
  subscribed: boolean
  subscriptionPurchased: boolean
  updatedOn: number
  updatedOnDate: string | null
  validTo: number
  marksheetInfo: ASATMarksheetInfo
  testInfo: ASATTestInfo
  resultInfo: ASATResultInfo
  viewed: boolean
}

// Paginated response from /secure/asat
export interface ASATPaginatedResponse {
  totalItems: number
  data: ASATScorecard[]
  totalPages: number
  currentPage: number
}

// Update status request params
export interface ASATUpdateParams {
  userId: string
  status: ASATStatus
  id: string
  rejectionRemarks?: string | null
}

// Download request params
export interface ASATDownloadParams {
  status: ASATStatus
  searchText?: string
}
