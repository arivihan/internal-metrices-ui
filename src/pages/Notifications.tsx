import { useState } from 'react'
import { format } from 'date-fns'
import {
  Send,
  Clock,
  Bell,
  MessageCircle,
  CalendarIcon,
  Upload,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

type NotificationType = 'app' | 'whatsapp'

interface NotificationFormData {
  title: string
  description: string
  mediaFile: File | null
  mediaPreview: string | null
}

interface ScheduleData {
  date: Date | undefined
  time: string
}

const initialFormData: NotificationFormData = {
  title: '',
  description: '',
  mediaFile: null,
  mediaPreview: null,
}

const initialScheduleData: ScheduleData = {
  date: undefined,
  time: '',
}

export default function Notifications() {
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>('app')
  const [formData, setFormData] = useState<NotificationFormData>(initialFormData)
  const [scheduleData, setScheduleData] = useState<ScheduleData>(initialScheduleData)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          mediaFile: file,
          mediaPreview: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeMedia = () => {
    setFormData((prev) => ({
      ...prev,
      mediaFile: null,
      mediaPreview: null,
    }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setScheduleData(initialScheduleData)
    setNotificationType('app')
  }

  const handleSendDialogClose = (open: boolean) => {
    if (!open) resetForm()
    setSendDialogOpen(open)
  }

  const handleScheduleDialogClose = (open: boolean) => {
    if (!open) resetForm()
    setScheduleDialogOpen(open)
  }

  const handleSendNotification = () => {
    // TODO: Implement API call to send notification
    console.log('Sending notification:', { type: notificationType, ...formData })
    handleSendDialogClose(false)
  }

  const handleScheduleNotification = () => {
    // TODO: Implement API call to schedule notification
    console.log('Scheduling notification:', {
      type: notificationType,
      ...formData,
      ...scheduleData,
    })
    handleScheduleDialogClose(false)
  }

  const NotificationForm = ({ showSchedule = false }: { showSchedule?: boolean }) => (
    <Tabs
      value={notificationType}
      onValueChange={(v) => setNotificationType(v as NotificationType)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="app" className="gap-2">
          <Bell className="size-4" />
          App Notification
        </TabsTrigger>
        <TabsTrigger value="whatsapp" className="gap-2">
          <MessageCircle className="size-4" />
          WhatsApp
        </TabsTrigger>
      </TabsList>

      <TabsContent value="app" className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-title">Title</Label>
          <Input
            id="app-title"
            placeholder="Enter notification title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="app-description">Description</Label>
          <Textarea
            id="app-description"
            placeholder="Enter notification message"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label>Media (Optional)</Label>
          {formData.mediaPreview ? (
            <div className="relative inline-block">
              <img
                src={formData.mediaPreview}
                alt="Preview"
                className="h-32 w-auto rounded-md border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 size-6"
                onClick={removeMedia}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="app-media"
                className="flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Upload className="size-5" />
                <span>Upload image</span>
              </Label>
              <Input
                id="app-media"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {showSchedule && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduleData.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {scheduleData.date
                      ? format(scheduleData.date, 'dd MMM yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleData.date}
                    onSelect={(date) =>
                      setScheduleData((prev) => ({ ...prev, date }))
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={scheduleData.time}
                onChange={(e) =>
                  setScheduleData((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="whatsapp" className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wa-title">Title</Label>
          <Input
            id="wa-title"
            placeholder="Enter message title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wa-description">Message</Label>
          <Textarea
            id="wa-description"
            placeholder="Enter WhatsApp message"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="min-h-24"
          />
        </div>

        <div className="space-y-2">
          <Label>Media (Optional)</Label>
          {formData.mediaPreview ? (
            <div className="relative inline-block">
              <img
                src={formData.mediaPreview}
                alt="Preview"
                className="h-32 w-auto rounded-md border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 size-6"
                onClick={removeMedia}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="wa-media"
                className="flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Upload className="size-5" />
                <span>Upload image</span>
              </Label>
              <Input
                id="wa-media"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
        </div>

        {showSchedule && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduleData.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {scheduleData.date
                      ? format(scheduleData.date, 'dd MMM yyyy')
                      : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleData.date}
                    onSelect={(date) =>
                      setScheduleData((prev) => ({ ...prev, date }))
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wa-schedule-time">Time</Label>
              <Input
                id="wa-schedule-time"
                type="time"
                value={scheduleData.time}
                onChange={(e) =>
                  setScheduleData((prev) => ({ ...prev, time: e.target.value }))
                }
              />
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Send Notification Card */}
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setSendDialogOpen(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Send className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>Send Notification</CardTitle>
                <CardDescription>
                  Send an instant notification to users
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          </Card>

        {/* Schedule Notification Card */}
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setScheduleDialogOpen(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>Schedule Notification</CardTitle>
                <CardDescription>
                  Schedule a notification for later
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Send Notification Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={handleSendDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send an instant notification to all users.
            </DialogDescription>
          </DialogHeader>

          <NotificationForm />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleSendDialogClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={!formData.title || !formData.description}
            >
              <Send className="mr-2 size-4" />
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Notification Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={handleScheduleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Notification</DialogTitle>
            <DialogDescription>
              Schedule a notification to be sent at a later time.
            </DialogDescription>
          </DialogHeader>

          <NotificationForm showSchedule />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleScheduleDialogClose(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleNotification}
              disabled={
                !formData.title ||
                !formData.description ||
                !scheduleData.date ||
                !scheduleData.time
              }
            >
              <Clock className="mr-2 size-4" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
