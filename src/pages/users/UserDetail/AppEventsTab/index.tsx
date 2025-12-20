import { Loader2 } from 'lucide-react'

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

import type { MicrolectureEvent, MicrolectureDoubtEvent, InteractivityEvent } from '@/types/user'

interface AppEventsTabProps {
  eventsSubTab: string
  setEventsSubTab: (tab: string) => void
  microlectureLoading: boolean
  microlectureLoaded: boolean
  microlectureEvents: MicrolectureEvent[]
  doubtLoading: boolean
  doubtLoaded: boolean
  doubtEvents: MicrolectureDoubtEvent[]
  interactivityLoading: boolean
  interactivityLoaded: boolean
  interactivityEvents: InteractivityEvent[]
}

export function AppEventsTab({
  eventsSubTab,
  setEventsSubTab,
  microlectureLoading,
  microlectureLoaded,
  microlectureEvents,
  doubtLoading,
  doubtLoaded,
  doubtEvents,
  interactivityLoading,
  interactivityLoaded,
  interactivityEvents,
}: AppEventsTabProps) {
  return (
    <Tabs value={eventsSubTab} onValueChange={setEventsSubTab} className="min-w-0 w-full">
      <TabsList>
        <TabsTrigger value="microlecture">
          Microlecture
          {microlectureLoaded && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({microlectureEvents.length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="doubt">
          Microlecture Doubt
          {doubtLoaded && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({doubtEvents.length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="interactivity">
          Interactivity Attempt
          {interactivityLoaded && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({interactivityEvents.length})
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Microlecture Tab */}
      <TabsContent value="microlecture" className="mt-4 min-w-0 overflow-hidden">
        {microlectureLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : microlectureEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No microlecture events found
          </p>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Chapter_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Subject_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Micro_Lecture_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Micro_Lecture_ID</TableHead>
                  <TableHead className="whitespace-nowrap">Phone_Number</TableHead>
                  <TableHead className="whitespace-nowrap">event_date</TableHead>
                  <TableHead className="whitespace-nowrap">Event_Type</TableHead>
                  <TableHead className="whitespace-nowrap">Course_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Class</TableHead>
                  <TableHead className="whitespace-nowrap">Course_ID</TableHead>
                  <TableHead className="whitespace-nowrap">userId</TableHead>
                  <TableHead className="whitespace-nowrap">Language</TableHead>
                  <TableHead className="whitespace-nowrap">Completed</TableHead>
                  <TableHead className="whitespace-nowrap">Environment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {microlectureEvents.map((event, index) => (
                  <TableRow key={`${event.Micro_Lecture_ID}-${index}`}>
                    <TableCell className="whitespace-nowrap">{event.Chapter_Name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Subject_Name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Micro_Lecture_Name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.Micro_Lecture_ID || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Phone_Number}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.event_date}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Event_Type}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Course_Name}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Class}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Course_ID}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.userId}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Language}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Completed}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Environment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* Microlecture Doubt Tab */}
      <TabsContent value="doubt" className="mt-4 min-w-0 overflow-hidden">
        {doubtLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : doubtEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No doubt events found
          </p>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">UserName</TableHead>
                  <TableHead className="whitespace-nowrap">Chapter_Name</TableHead>
                  <TableHead className="whitespace-nowrap">ASUserDoubt</TableHead>
                  <TableHead className="whitespace-nowrap">Subject_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Chapter_ID</TableHead>
                  <TableHead className="whitespace-nowrap">Micro_Lecture_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Micro_Lecture_ID</TableHead>
                  <TableHead className="whitespace-nowrap">Phone_Number</TableHead>
                  <TableHead className="whitespace-nowrap">event_date</TableHead>
                  <TableHead className="whitespace-nowrap">Event_Type</TableHead>
                  <TableHead className="whitespace-nowrap">Course_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Class</TableHead>
                  <TableHead className="whitespace-nowrap">Course_ID</TableHead>
                  <TableHead className="whitespace-nowrap">userId</TableHead>
                  <TableHead className="whitespace-nowrap">Language</TableHead>
                  <TableHead className="whitespace-nowrap">Environment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doubtEvents.map((event, index) => (
                  <TableRow key={`${event.Micro_Lecture_ID}-${index}`}>
                    <TableCell className="whitespace-nowrap">{event.UserName}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Chapter_Name || '—'}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={event.ASUserDoubt}>
                        {event.ASUserDoubt}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{event.Subject_Name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.Chapter_ID || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Micro_Lecture_Name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.Micro_Lecture_ID || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Phone_Number}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.event_date}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Event_Type}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Course_Name}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Class}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Course_ID}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.userId}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Language}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Environment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* Interactivity Attempt Tab */}
      <TabsContent value="interactivity" className="mt-4 min-w-0 overflow-hidden">
        {interactivityLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : interactivityEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No interactivity events found
          </p>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">UserName</TableHead>
                  <TableHead className="whitespace-nowrap">Chapter_Name</TableHead>
                  <TableHead className="whitespace-nowrap">User_Answer</TableHead>
                  <TableHead className="whitespace-nowrap">Question_Id</TableHead>
                  <TableHead className="whitespace-nowrap">SubjectName</TableHead>
                  <TableHead className="whitespace-nowrap">Chapter_ID</TableHead>
                  <TableHead className="whitespace-nowrap">Micro_Lecture_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Micro_Lecture_ID</TableHead>
                  <TableHead className="whitespace-nowrap">Phone_Number</TableHead>
                  <TableHead className="whitespace-nowrap">event_date</TableHead>
                  <TableHead className="whitespace-nowrap">Event_Type</TableHead>
                  <TableHead className="whitespace-nowrap">Course_Name</TableHead>
                  <TableHead className="whitespace-nowrap">Class</TableHead>
                  <TableHead className="whitespace-nowrap">Course_ID</TableHead>
                  <TableHead className="whitespace-nowrap">userId</TableHead>
                  <TableHead className="whitespace-nowrap">Language</TableHead>
                  <TableHead className="whitespace-nowrap">Environment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interactivityEvents.map((event, index) => (
                  <TableRow key={`${event.Question_Id}-${index}`}>
                    <TableCell className="whitespace-nowrap">{event.UserName}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Chapter_Name || '—'}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={event.User_Answer}>
                        {event.User_Answer}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.Question_Id}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.SubjectName || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.Chapter_ID || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Micro_Lecture_Name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.Micro_Lecture_ID || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Phone_Number}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.event_date}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Event_Type}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Course_Name}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Class}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Course_ID}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{event.userId}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Language}</TableCell>
                    <TableCell className="whitespace-nowrap">{event.Environment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
