import { Loader2, UserCircle, Gift, BookOpen, Activity } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'

import type { UserDetail, UserTestActivity } from '@/types/user'

interface UserDetailsTabProps {
  user: UserDetail
  testActivity: UserTestActivity | null
  testLoading: boolean
}

export function UserDetailsTab({ user, testActivity, testLoading }: UserDetailsTabProps) {
  return (
    <div className="min-w-0 space-y-6">
      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info Card */}
        <Card className="border">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <UserCircle className="size-5 text-muted-foreground" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
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
        <Card className="border">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Gift className="size-5 text-muted-foreground" />
              Rewards & Referral
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
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
        <Card className="border">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BookOpen className="size-5 text-muted-foreground" />
              Enrolled Subjects
              <span className="text-sm font-normal text-muted-foreground">
                ({user.subjects.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
      <Card className="min-w-0 overflow-hidden border">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="size-5 text-muted-foreground" />
            {testActivity?.title || 'Test Series Activity'}
            {!testLoading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({testActivity?.data.length ?? 0} tests)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden p-6">
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
                        let header = col.header
                        if (col.accessor === 'scoreCompare') {
                          header = 'Obtained / Total'
                        }
                        return (
                          <TableHead key={col.accessor} className="whitespace-nowrap">
                            {header}
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
    </div>
  )
}
