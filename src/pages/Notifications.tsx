import { useState } from 'react'
import { format } from 'date-fns'
import {
  Send,
  Bell,
  CalendarIcon,
  Loader2,
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
import { cn } from '@/lib/utils'
import { sendNotification, type NotificationPayload } from '@/services/notification'
import { toast } from 'sonner'

interface NotificationFormData {
  title: string
  description: string
  message: string
  messageType: string
  imageUrl: string
  templateName: string
  templateParams: string
  customPayload: string
  to: string
  topics: string
  userIds: string
  type: string
  scheduleDate: Date | undefined
  scheduleTime: string
}

const initialFormData: NotificationFormData = {
  title: '',
  description: '',
  message: '',
  messageType: 'WHATSAPP',
  imageUrl: '',
  templateName: '',
  templateParams: '',
  customPayload: '',
  to: '',
  topics: '',
  userIds: '',
  type: '',
  scheduleDate: undefined,
  scheduleTime: '',
}

export default function Notifications() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<NotificationFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) resetForm()
    setDialogOpen(open)
  }

  const parseJsonSafe = (str: string): Record<string, unknown> => {
    if (!str.trim()) return {}
    try {
      return JSON.parse(str)
    } catch {
      return {}
    }
  }

  const parseArrayFromString = (str: string): string[] => {
    if (!str.trim()) return []
    return str.split(',').map((item) => item.trim()).filter(Boolean)
  }

  const handleSendNotification = async () => {
    setIsSubmitting(true)

    const payload: NotificationPayload = {
      title: formData.title || undefined,
      description: formData.description || undefined,
      message: formData.message || undefined,
      messageType: formData.messageType,
      imageUrl: formData.imageUrl || undefined,
      templateName: formData.templateName || undefined,
      templateParams: parseJsonSafe(formData.templateParams),
      customPayload: parseJsonSafe(formData.customPayload),
      to: parseArrayFromString(formData.to),
      topics: parseArrayFromString(formData.topics),
      userIds: parseArrayFromString(formData.userIds),
      type: formData.type || undefined,
      scheduleDate: formData.scheduleDate
        ? format(formData.scheduleDate, 'yyyy-MM-dd')
        : undefined,
      scheduleTime: formData.scheduleTime || undefined,
    }

    try {
      await sendNotification(payload)
      toast.success('Notification sent successfully')
      handleDialogClose(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send notification'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = <K extends keyof NotificationFormData>(
    field: K,
    value: NotificationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setDialogOpen(true)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>Send Notification</CardTitle>
                <CardDescription>
                  Send notifications via App or WhatsApp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-150">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Configure and send a notification to users.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Message Type */}
            <div className="space-y-2">
              <Label htmlFor="messageType">Message Type *</Label>
              <Select
                value={formData.messageType}
                onValueChange={(value) => updateField('messageType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="APP">App Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Notification description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="min-h-20"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Notification message content"
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                className="min-h-20"
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.png"
                value={formData.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
              />
            </div>

            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g., arts_ecohin_06"
                value={formData.templateName}
                onChange={(e) => updateField('templateName', e.target.value)}
              />
            </div>

            {/* Template Params (JSON) */}
            <div className="space-y-2">
              <Label htmlFor="templateParams">Template Params (JSON)</Label>
              <Textarea
                id="templateParams"
                placeholder='{"key": "value"}'
                value={formData.templateParams}
                onChange={(e) => updateField('templateParams', e.target.value)}
                className="min-h-16 font-mono text-sm"
              />
            </div>

            {/* Custom Payload (JSON) */}
            <div className="space-y-2">
              <Label htmlFor="customPayload">Custom Payload (JSON)</Label>
              <Textarea
                id="customPayload"
                placeholder='{"key": "value"}'
                value={formData.customPayload}
                onChange={(e) => updateField('customPayload', e.target.value)}
                className="min-h-16 font-mono text-sm"
              />
            </div>

            {/* To (Phone Numbers) */}
            <div className="space-y-2">
              <Label htmlFor="to">To (Phone Numbers)</Label>
              <Textarea
                id="to"
                placeholder="Comma-separated phone numbers, e.g., 7415718139, 9876543210"
                value={formData.to}
                onChange={(e) => updateField('to', e.target.value)}
                className="min-h-16"
              />
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <Label htmlFor="topics">Topics</Label>
              <Input
                id="topics"
                placeholder="Comma-separated topics"
                value={formData.topics}
                onChange={(e) => updateField('topics', e.target.value)}
              />
            </div>

            {/* User IDs */}
            <div className="space-y-2">
              <Label htmlFor="userIds">User IDs</Label>
              <Textarea
                id="userIds"
                placeholder="Comma-separated user IDs"
                value={formData.userIds}
                onChange={(e) => updateField('userIds', e.target.value)}
                className="min-h-16"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                placeholder="Notification type"
                value={formData.type}
                onChange={(e) => updateField('type', e.target.value)}
              />
            </div>

            {/* Schedule Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.scheduleDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {formData.scheduleDate
                        ? format(formData.scheduleDate, 'dd MMM yyyy')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduleDate}
                      onSelect={(date) => updateField('scheduleDate', date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleTime">Schedule Time</Label>
                <Input
                  id="scheduleTime"
                  type="time"
                  value={formData.scheduleTime}
                  onChange={(e) => updateField('scheduleTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
