import { apiClient } from './apiClient'

export interface NotificationPayload {
  customPayload?: Record<string, unknown>
  description?: string
  imageUrl?: string
  message?: string
  messageType: 'WHATSAPP' | 'APP' | string
  scheduleDate?: string
  scheduleTime?: string
  templateName?: string
  templateParams?: Record<string, unknown>
  title?: string
  to?: string[]
  topics?: string[]
  type?: string
  userIds?: string[]
}

export interface NotificationResponse {
  success: boolean
  message?: string
}

export const sendNotification = async (
  payload: NotificationPayload
): Promise<NotificationResponse> => {
  return apiClient<NotificationResponse>('/secure/notification/sendGeneric', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
