import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Download,
  CalendarIcon,
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

import { fetchUsers, type UserFilters } from '@/services/users'
import type { UserListItem, PaginatedResponse } from '@/types/user'
import { cn } from '@/lib/utils'

type SearchType = 'phoneNumber' | 'username' | 'userId' | 'registrationDate' | 'subscriptionDate'

const searchTypeOptions: { value: SearchType; label: string }[] = [
  { value: 'phoneNumber', label: 'Phone Number' },
  { value: 'username', label: 'Username' },
  { value: 'userId', label: 'User ID' },
  { value: 'registrationDate', label: 'Registration Date' },
  { value: 'subscriptionDate', label: 'Subscription Date' },
]

const isDateSearch = (type: SearchType) =>
  type === 'registrationDate' || type === 'subscriptionDate'

interface ActiveSearch {
  type: SearchType
  value?: string
  startDate?: string
  endDate?: string
}

export default function Users() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PaginatedResponse<UserListItem> | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 10

  // UI states (what user sees/interacts with)
  const [searchType, setSearchType] = useState<SearchType>('phoneNumber')
  const [searchInput, setSearchInput] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()

  // Active search (what's actually sent to API)
  const [activeSearch, setActiveSearch] = useState<ActiveSearch | null>(null)

  // Filter states
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('')
  const [genderFilter, setGenderFilter] = useState<string>('')

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Debounce text search
  useEffect(() => {
    if (isDateSearch(searchType)) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (searchInput) {
        setActiveSearch({ type: searchType, value: searchInput })
        setPage(0)
      } else if (activeSearch?.value) {
        setActiveSearch(null)
        setPage(0)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput, searchType])

  // Handle date selection
  useEffect(() => {
    if (!isDateSearch(searchType)) return

    if (startDate && endDate) {
      setActiveSearch({
        type: searchType,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      })
      setPage(0)
    } else if (activeSearch?.startDate) {
      setActiveSearch(null)
      setPage(0)
    }
  }, [startDate, endDate, searchType])

  // Fetch users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        const filters: UserFilters = {
          page,
          size: pageSize,
        }

        if (genderFilter) filters.gender = genderFilter
        if (subscriptionFilter) filters.subscriptionStatus = subscriptionFilter

        // Apply active search
        if (activeSearch) {
          filters.searchBy = activeSearch.type
          if (activeSearch.value) {
            filters.searchText = activeSearch.value
          }
          if (activeSearch.startDate && activeSearch.endDate) {
            filters.fromDate = activeSearch.startDate
            filters.toDate = activeSearch.endDate
          }
        }

        const response = await fetchUsers(filters)
        setData(response)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [page, genderFilter, subscriptionFilter, activeSearch])

  const handleViewUser = (userId: string) => {
    navigate(`/dashboard/users/detail/${userId}`)
  }

  const handleSearchTypeChange = (value: SearchType) => {
    setSearchType(value)
    // Clear inputs but don't clear activeSearch yet (table keeps current results)
    setSearchInput('')
    setStartDate(undefined)
    setEndDate(undefined)
  }

  const handleFilterChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value)
    setPage(0)
  }

  const clearAll = () => {
    setSearchType('phoneNumber')
    setSearchInput('')
    setStartDate(undefined)
    setEndDate(undefined)
    setActiveSearch(null)
    setGenderFilter('')
    setSubscriptionFilter('')
    setPage(0)
  }

  const hasActiveFilters =
    genderFilter || subscriptionFilter || activeSearch

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Type Selector */}
        <Select value={searchType} onValueChange={handleSearchTypeChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {searchTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Text Search or Date Range */}
        {isDateSearch(searchType) ? (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[140px] justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {startDate ? format(startDate, 'dd MMM yyyy') : 'Start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[140px] justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {endDate ? format(endDate, 'dd MMM yyyy') : 'End date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => (startDate ? date < startDate : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="relative w-[240px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search by ${searchTypeOptions.find((o) => o.value === searchType)?.label.toLowerCase()}...`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Gender Filter */}
        <Select
          value={genderFilter}
          onValueChange={(v) => handleFilterChange(setGenderFilter, v)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={subscriptionFilter}
          onValueChange={(v) => handleFilterChange(setSubscriptionFilter, v)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="subscribed">Subscribed</SelectItem>
            <SelectItem value="free">Free</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground"
          >
            Clear
          </Button>
        )}

        {/* Export Button */}
        <Button variant="outline" size="sm" className="ml-auto">
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.content.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.content.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phoneNumber}
                      </TableCell>
                      <TableCell>{user.selectedCourse}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.language}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            user.subscribed
                              ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          )}
                        >
                          {user.subscribed ? 'Subscribed' : 'Free'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.registrationDate)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleViewUser(user.userId)}
                        >
                          <Eye className="size-4" />
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
                  {data.totalElements} users
                </p>
                {data.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {data.number + 1} of {data.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={data.first}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={data.last}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
